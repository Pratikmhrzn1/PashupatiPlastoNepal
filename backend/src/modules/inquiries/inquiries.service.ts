import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { Inquiry, InquiryStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import { MailService } from '../mail/mail.service.js';
import {
  sanitizeSingleLine,
  sanitizeText,
} from '../../common/utils/sanitize.utils.js';
import { inquiryConfirmationTemplate } from '../mail/templates/inquiry-confirmation.template.js';
import { inquiryNotificationTemplate } from '../mail/templates/inquiry-notification.template.js';
import { CreateInquiryDto } from './dto/create-inquiry.dto.js';
import { QueryInquiriesDto } from './dto/query-inquiries.dto.js';
import { SpamService } from './spam.service.js';
import {
  AdminInquiryResponse,
  InquirySubmissionResult,
  PaginatedInquiries,
} from './inquiry.types.js';

const SUBMISSION_ACKNOWLEDGEMENT =
  'Thanks for getting in touch. We will get back to you shortly.';

/** Subject used when the public contact form does not provide one. */
const DEFAULT_SUBJECT = 'Website enquiry';

@Injectable()
export class InquiriesService {
  private readonly logger = new Logger(InquiriesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly spamService: SpamService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Stores an inquiry submitted through the public contact form.
   *
   * Spam that trips the honeypot is dropped silently - the caller still gets a
   * success response so a bot cannot learn that it was filtered.
   */
  async submit(
    dto: CreateInquiryDto,
    context: { ipAddress?: string } = {},
  ): Promise<InquirySubmissionResult> {
    if (this.spamService.isHoneypotTriggered(dto.website)) {
      this.logger.warn('Inquiry dropped by the honeypot filter.');
      return this.acknowledgement(randomUUID());
    }

    const turnstile = await this.spamService.verifyTurnstile(
      dto.turnstileToken,
      context.ipAddress,
    );

    if (!turnstile.success) {
      throw new BadRequestException(
        'We could not verify your submission. Please try again.',
      );
    }

    const name = sanitizeSingleLine(dto.name);
    const email = sanitizeSingleLine(dto.email).toLowerCase();
    const phone = dto.phone ? sanitizeSingleLine(dto.phone) : null;
    const subject = sanitizeSingleLine(dto.subject ?? '') || DEFAULT_SUBJECT;
    const message = sanitizeText(dto.message);

    const product = await this.resolveProduct(dto.productId);

    const inquiry = await this.prisma.inquiry.create({
      data: {
        name,
        email,
        phone,
        subject,
        message,
        productId: product?.id ?? null,
        status: InquiryStatus.NEW,
        ipAddress: context.ipAddress ?? null,
      },
    });

    await this.notifyAdmin(inquiry, product?.name ?? null);
    await this.confirmToVisitor(inquiry);

    return this.acknowledgement(inquiry.id, inquiry.createdAt);
  }

  async findAll(
    query: QueryInquiriesDto,
  ): Promise<PaginatedInquiries<AdminInquiryResponse>> {
    const where: Prisma.InquiryWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { subject: { contains: query.search, mode: 'insensitive' } },
        { message: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.InquiryOrderByWithRelationInput = {
      [query.sort]: query.order,
    };

    const [total, inquiries] = await this.prisma.$transaction([
      this.prisma.inquiry.count({ where }),
      this.prisma.inquiry.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);

    const totalPages = Math.ceil(total / query.limit);

    return {
      data: inquiries.map((inquiry) => toAdminInquiryResponse(inquiry)),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
        hasNextPage: query.page < totalPages,
        hasPreviousPage: query.page > 1,
      },
    };
  }

  async findOne(id: string): Promise<AdminInquiryResponse> {
    const inquiry = await this.prisma.inquiry.findUnique({ where: { id } });

    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }

    return toAdminInquiryResponse(inquiry);
  }

  async updateStatus(
    id: string,
    status: InquiryStatus,
  ): Promise<AdminInquiryResponse> {
    await this.ensureExists(id);

    const inquiry = await this.prisma.inquiry.update({
      where: { id },
      data: { status },
    });

    return toAdminInquiryResponse(inquiry);
  }

  async updateNote(id: string, note?: string): Promise<AdminInquiryResponse> {
    await this.ensureExists(id);

    const trimmed = note?.trim();
    const inquiry = await this.prisma.inquiry.update({
      where: { id },
      data: { internalNote: trimmed ? trimmed : null },
    });

    return toAdminInquiryResponse(inquiry);
  }

  async remove(id: string): Promise<void> {
    await this.ensureExists(id);

    await this.prisma.inquiry.delete({ where: { id } });
  }

  private async ensureExists(id: string): Promise<void> {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }
  }

  /**
   * Looks up the referenced product.
   *
   * An inquiry can reference a product that was removed in the meantime, in
   * which case the inquiry is still accepted - it just loses the link.
   */
  private async resolveProduct(productId?: string) {
    if (!productId) {
      return null;
    }

    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
      select: { id: true, name: true },
    });

    if (!product) {
      throw new BadRequestException('The referenced product does not exist');
    }

    return product;
  }

  private acknowledgement(
    id: string,
    submittedAt: Date = new Date(),
  ): InquirySubmissionResult {
    return {
      id,
      status: InquiryStatus.NEW,
      message: SUBMISSION_ACKNOWLEDGEMENT,
      submittedAt,
    };
  }

  /**
   * Sends the admin notification.
   *
   * A mail outage must not lose the inquiry: the record is already stored, so
   * the failure is logged and swallowed.
   */
  private async notifyAdmin(
    inquiry: Inquiry,
    productName: string | null,
  ): Promise<void> {
    const recipient = this.configService.get<string>('inquiry.notifyEmail');

    if (!recipient) {
      this.logger.warn(
        'No inquiry notification recipient configured, skipping admin email.',
      );
      return;
    }

    const template = inquiryNotificationTemplate({
      inquiryId: inquiry.id,
      name: inquiry.name,
      email: inquiry.email,
      phone: inquiry.phone,
      subject: inquiry.subject,
      message: inquiry.message,
      productName,
      submittedAt: inquiry.createdAt,
    });

    await this.deliver({
      to: recipient,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /** Sends the optional "we received your message" email to the visitor. */
  private async confirmToVisitor(inquiry: Inquiry): Promise<void> {
    const enabled = this.configService.get<boolean>('inquiry.autoConfirm');

    if (!enabled) {
      return;
    }

    const template = inquiryConfirmationTemplate({
      name: inquiry.name,
      subject: inquiry.subject,
    });

    await this.deliver({
      to: inquiry.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  private async deliver(message: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<void> {
    try {
      const result = await this.mailService.send(message);
      this.logger.log(`Mail sent via ${result.provider} to ${message.to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send "${message.subject}" to ${message.to}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}

const toAdminInquiryResponse = (inquiry: Inquiry): AdminInquiryResponse => ({
  id: inquiry.id,
  name: inquiry.name,
  email: inquiry.email,
  phone: inquiry.phone,
  subject: inquiry.subject,
  message: inquiry.message,
  productId: inquiry.productId,
  status: inquiry.status,
  internalNote: inquiry.internalNote,
  ipAddress: inquiry.ipAddress,
  createdAt: inquiry.createdAt,
  updatedAt: inquiry.updatedAt,
});
