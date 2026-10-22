import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { hashPassword } from '../../common/utils/crypto.utils.js';

export interface AdminSummary {
  id: string;
  email: string;
  role: string;
  emailVerified: boolean;
}

@Injectable()
export class AdminsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(email: string, password: string): Promise<AdminSummary> {
    const passwordHash = await hashPassword(password);

    const admin = await this.prisma.admin.create({
      data: { email: email.toLowerCase(), passwordHash },
      select: { id: true, email: true, role: true, emailVerified: true },
    });

    return admin;
  }

  async findById(id: string): Promise<AdminSummary | null> {
    return this.prisma.admin.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, emailVerified: true },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.admin.findUnique({
      where: { email: email.toLowerCase() },
    });
  }
}
