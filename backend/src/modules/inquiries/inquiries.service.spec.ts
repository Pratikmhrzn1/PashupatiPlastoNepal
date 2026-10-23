import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InquiryStatus } from '@prisma/client';
import { InquiriesService } from './inquiries.service.js';
import { SpamService } from './spam.service.js';
import { PrismaService } from '../../database/prisma.service.js';
import { MailService } from '../mail/mail.service.js';
import { MockMailService } from '../../../test/mocks/mock-mail.service.js';
import { CreateInquiryDto } from './dto/create-inquiry.dto.js';
import { QueryInquiriesDto } from './dto/query-inquiries.dto.js';

const buildInquiry = (overrides: Record<string, unknown> = {}) => ({
  id: 'inquiry-1',
  name: 'Ram Bahadur',
  email: 'ram@example.com',
  phone: null,
  subject: 'Bulk order',
  message: 'I would like 50 chairs.',
  productId: null,
  status: InquiryStatus.NEW,
  internalNote: null,
  ipAddress: '203.0.113.5',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  ...overrides,
});

const buildDto = (
  overrides: Partial<CreateInquiryDto> = {},
): CreateInquiryDto =>
  Object.assign(new CreateInquiryDto(), {
    name: 'Ram Bahadur',
    email: 'ram@example.com',
    phone: '+977-9800000000',
    subject: 'Bulk order',
    message: 'I would like 50 chairs.',
    ...overrides,
  });

describe('InquiriesService', () => {
  let service: InquiriesService;
  let mail: MockMailService;
  let prisma: any;
  let spam: {
    isHoneypotTriggered: ReturnType<typeof vi.fn>;
    verifyTurnstile: ReturnType<typeof vi.fn>;
  };
  let configValues: Record<string, unknown>;

  beforeEach(async () => {
    mail = new MockMailService();

    prisma = {
      inquiry: {
        create: vi.fn().mockResolvedValue(buildInquiry()),
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
        count: vi.fn().mockResolvedValue(0),
        update: vi.fn().mockResolvedValue(buildInquiry()),
        delete: vi.fn().mockResolvedValue({}),
      },
      product: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
      $transaction: vi.fn(async (operations: Promise<unknown>[]) =>
        Promise.all(operations),
      ),
    };

    spam = {
      isHoneypotTriggered: vi.fn().mockReturnValue(false),
      verifyTurnstile: vi
        .fn()
        .mockResolvedValue({ success: true, errorCodes: [] }),
    };

    configValues = {
      'inquiry.notifyEmail': 'admin@example.com',
      'inquiry.autoConfirm': false,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InquiriesService,
        { provide: PrismaService, useValue: prisma },
        { provide: MailService, useValue: mail },
        { provide: SpamService, useValue: spam },
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn((key: string) => configValues[key]),
          },
        },
      ],
    }).compile();

    service = module.get(InquiriesService);
  });

  describe('submit', () => {
    it('stores the inquiry and returns an acknowledgement', async () => {
      const result = await service.submit(buildDto(), {
        ipAddress: '203.0.113.5',
      });

      expect(prisma.inquiry.create).toHaveBeenCalledTimes(1);
      expect(result.status).toBe(InquiryStatus.NEW);
      expect(result.id).toBe('inquiry-1');
      expect(result.message).toContain('Thanks for getting in touch');
    });

    it('stores the submitted ip address', async () => {
      await service.submit(buildDto(), { ipAddress: '203.0.113.5' });

      const arg = prisma.inquiry.create.mock.calls[0][0];
      expect(arg.data.ipAddress).toBe('203.0.113.5');
    });

    it('strips markup and control characters from visitor input', async () => {
      await service.submit(
        buildDto({
          name: '<script>alert(1)</script>Ram',
          subject: '  Bulk   order  ',
          message: 'Hello <b>there</b>',
        }),
      );

      const arg = prisma.inquiry.create.mock.calls[0][0];
      expect(arg.data.name).toBe('alert(1)Ram');
      expect(arg.data.subject).toBe('Bulk order');
      expect(arg.data.message).toBe('Hello there');
    });

    it('normalises the email address', async () => {
      await service.submit(buildDto({ email: 'RAM@Example.com' }));

      const arg = prisma.inquiry.create.mock.calls[0][0];
      expect(arg.data.email).toBe('ram@example.com');
    });

    it('drops submissions that trip the honeypot without storing them', async () => {
      spam.isHoneypotTriggered.mockReturnValue(true);

      const result = await service.submit(
        buildDto({ website: 'spam.example' }),
      );

      expect(prisma.inquiry.create).not.toHaveBeenCalled();
      expect(mail.sent).toHaveLength(0);
      expect(result.status).toBe(InquiryStatus.NEW);
    });

    it('rejects the submission when turnstile verification fails', async () => {
      spam.verifyTurnstile.mockResolvedValue({
        success: false,
        errorCodes: ['invalid-input-response'],
      });

      await expect(service.submit(buildDto())).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.inquiry.create).not.toHaveBeenCalled();
    });

    it('rejects an inquiry that references an unknown product', async () => {
      prisma.product.findFirst.mockResolvedValue(null);

      await expect(
        service.submit(buildDto({ productId: 'missing' })),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.inquiry.create).not.toHaveBeenCalled();
    });

    it('links the inquiry to an existing product', async () => {
      prisma.product.findFirst.mockResolvedValue({
        id: 'product-1',
        name: 'Plastic Chair',
      });

      await service.submit(buildDto({ productId: 'product-1' }));

      const arg = prisma.inquiry.create.mock.calls[0][0];
      expect(arg.data.productId).toBe('product-1');
    });

    it('notifies the admin address', async () => {
      await service.submit(buildDto());

      expect(mail.sent).toHaveLength(1);
      expect(mail.last()?.to).toBe('admin@example.com');
      expect(mail.last()?.subject).toContain('Bulk order');
    });

    it('mentions the product name in the notification', async () => {
      prisma.product.findFirst.mockResolvedValue({
        id: 'product-1',
        name: 'Plastic Chair',
      });

      await service.submit(buildDto({ productId: 'product-1' }));

      expect(mail.last()?.html).toContain('Plastic Chair');
    });

    it('keeps the inquiry when the notification email fails', async () => {
      mail.shouldFail = true;

      const result = await service.submit(buildDto());

      expect(prisma.inquiry.create).toHaveBeenCalledTimes(1);
      expect(result.id).toBe('inquiry-1');
    });

    it('does not send a confirmation email unless auto-confirm is enabled', async () => {
      await service.submit(buildDto());

      expect(mail.sent).toHaveLength(1);
      expect(mail.last()?.to).toBe('admin@example.com');
    });

    it('sends a confirmation email to the visitor when auto-confirm is enabled', async () => {
      configValues['inquiry.autoConfirm'] = true;

      await service.submit(buildDto());

      expect(mail.sent).toHaveLength(2);
      expect(mail.last()?.to).toBe('ram@example.com');
    });

    it('skips the admin notification when no recipient is configured', async () => {
      configValues['inquiry.notifyEmail'] = '';

      await service.submit(buildDto());

      expect(mail.sent).toHaveLength(0);
      expect(prisma.inquiry.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    const query = (overrides: Partial<QueryInquiriesDto> = {}) =>
      Object.assign(new QueryInquiriesDto(), {
        page: 1,
        limit: 20,
        sort: 'createdAt',
        order: 'desc',
        ...overrides,
      });

    it('returns the paginated inquiries', async () => {
      prisma.inquiry.count.mockResolvedValue(1);
      prisma.inquiry.findMany.mockResolvedValue([buildInquiry()]);

      const result = await service.findAll(query());

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
      expect(result.data[0].email).toBe('ram@example.com');
    });

    it('filters by status', async () => {
      await service.findAll(query({ status: InquiryStatus.REPLIED }));

      const arg = prisma.inquiry.findMany.mock.calls[0][0];
      expect(arg.where.status).toBe(InquiryStatus.REPLIED);
    });

    it('searches across the visitor fields', async () => {
      await service.findAll(query({ search: 'chair' }));

      const arg = prisma.inquiry.findMany.mock.calls[0][0];
      expect(arg.where.OR).toHaveLength(4);
    });

    it('paginates with the requested page and limit', async () => {
      await service.findAll(query({ page: 3, limit: 5 }));

      const arg = prisma.inquiry.findMany.mock.calls[0][0];
      expect(arg.skip).toBe(10);
      expect(arg.take).toBe(5);
    });
  });

  describe('findOne', () => {
    it('throws when the inquiry does not exist', async () => {
      prisma.inquiry.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns the inquiry including internal fields', async () => {
      prisma.inquiry.findUnique.mockResolvedValue(
        buildInquiry({ internalNote: 'call back' }),
      );

      const result = await service.findOne('inquiry-1');

      expect(result.internalNote).toBe('call back');
      expect(result.ipAddress).toBe('203.0.113.5');
    });
  });

  describe('updateStatus', () => {
    it('updates the status', async () => {
      prisma.inquiry.findUnique.mockResolvedValue({ id: 'inquiry-1' });
      prisma.inquiry.update.mockResolvedValue(
        buildInquiry({ status: InquiryStatus.REPLIED }),
      );

      const result = await service.updateStatus(
        'inquiry-1',
        InquiryStatus.REPLIED,
      );

      expect(result.status).toBe(InquiryStatus.REPLIED);
    });

    it('throws when the inquiry does not exist', async () => {
      prisma.inquiry.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus('missing', InquiryStatus.READ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('updateNote', () => {
    it('stores the internal note', async () => {
      prisma.inquiry.findUnique.mockResolvedValue({ id: 'inquiry-1' });

      await service.updateNote('inquiry-1', '  call back  ');

      const arg = prisma.inquiry.update.mock.calls[0][0];
      expect(arg.data.internalNote).toBe('call back');
    });

    it('clears the internal note when an empty note is sent', async () => {
      prisma.inquiry.findUnique.mockResolvedValue({ id: 'inquiry-1' });

      await service.updateNote('inquiry-1', '');

      const arg = prisma.inquiry.update.mock.calls[0][0];
      expect(arg.data.internalNote).toBeNull();
    });
  });

  describe('remove', () => {
    it('deletes the inquiry', async () => {
      prisma.inquiry.findUnique.mockResolvedValue({ id: 'inquiry-1' });

      await service.remove('inquiry-1');

      expect(prisma.inquiry.delete).toHaveBeenCalledWith({
        where: { id: 'inquiry-1' },
      });
    });

    it('throws when the inquiry does not exist', async () => {
      prisma.inquiry.findUnique.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.inquiry.delete).not.toHaveBeenCalled();
    });
  });
});
