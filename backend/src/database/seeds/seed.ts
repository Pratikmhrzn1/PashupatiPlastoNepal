import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../../common/utils/crypto.utils.js';

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? '').toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set to seed an admin.');
    process.exit(1);
  }

  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin ${email} already exists, skipping.`);
    return;
  }

  const passwordHash = await hashPassword(password);

  await prisma.admin.create({
    data: {
      email,
      passwordHash,
      role: 'ADMIN',
      emailVerified: true,
    },
  });

  console.log(`Admin ${email} created.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
