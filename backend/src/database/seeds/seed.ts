import { PrismaClient, ProductStatus } from '@prisma/client';
import { hashPassword } from '../../common/utils/crypto.utils.js';
import { PRODUCT_CATALOG } from '../../modules/products/product-catalog.data.js';

const prisma = new PrismaClient();

async function seedAdmin(email: string, password: string): Promise<string> {
  const existing = await prisma.admin.findUnique({ where: { email } });

  if (existing) {
    console.log(`Admin ${email} already exists, skipping.`);
    return existing.id;
  }

  const passwordHash = await hashPassword(password);

  const admin = await prisma.admin.create({
    data: {
      email,
      passwordHash,
      role: 'ADMIN',
      emailVerified: true,
    },
  });

  console.log(`Admin ${email} created.`);
  return admin.id;
}

/**
 * Seeds the published catalog. Products are matched on their slug so re-running
 * the seed refreshes the catalogue instead of duplicating it.
 */
async function seedProducts(createdById: string): Promise<void> {
  for (const product of PRODUCT_CATALOG) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        description: product.description,
        price: product.price,
        currency: product.currency,
        unit: product.unit,
        images: product.images,
        category: product.category,
        status: ProductStatus.ACTIVE,
        featured: product.featured,
        deletedAt: null,
      },
      create: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        currency: product.currency,
        unit: product.unit,
        images: product.images,
        category: product.category,
        status: ProductStatus.ACTIVE,
        featured: product.featured,
        createdById,
      },
    });
  }

  console.log(`Seeded ${PRODUCT_CATALOG.length} products.`);
}

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? '').toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error(
      'ADMIN_EMAIL and ADMIN_PASSWORD must be set to seed an admin.',
    );
    process.exit(1);
  }

  const adminId = await seedAdmin(email, password);

  await seedProducts(adminId);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
