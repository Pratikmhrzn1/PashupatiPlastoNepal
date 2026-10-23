/**
 * Static marketing catalog.
 *
 * The published product range is fixed: it is seeded into the database and the
 * "sold" counters are static marketing figures (not tracked anywhere), so they
 * live here next to the catalog itself instead of in a database column.
 *
 * The frontend mock (`frontend/src/services/mock/data.ts`) mirrors this list.
 */
export interface CatalogProduct {
  slug: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  unit: string;
  images: string[];
  category: string;
  soldCount: number;
  featured: boolean;
}

export const PRODUCT_CATALOG: CatalogProduct[] = [
  {
    slug: 'safety-helmets',
    name: 'Safety Helmets',
    description:
      'Injection-moulded ABS safety helmets for industrial and site use.',
    price: '450',
    currency: 'NPR',
    unit: 'piece',
    images: ['/products/helmet.webp'],
    category: 'Safety',
    soldCount: 3200,
    featured: true,
  },
  {
    slug: 'oem-pipe-fittings',
    name: 'OEM Pipe Fittings',
    description:
      'Custom-moulded OEM fittings produced to client drawings and tolerances.',
    price: '180',
    currency: 'NPR',
    unit: 'piece',
    images: ['/products/oempipefitting.webp'],
    category: 'Pipe Fittings',
    soldCount: 2800,
    featured: true,
  },
  {
    slug: 'pipe-clamps',
    name: 'Pipe Clamps',
    description:
      'Durable PP clamps for joining and securing pipeline sections.',
    price: '65',
    currency: 'NPR',
    unit: 'piece',
    images: ['/products/pipeclamp.webp'],
    category: 'Pipe Fittings',
    soldCount: 2400,
    featured: true,
  },
  {
    slug: 'plastic-brick-moulds',
    name: 'Plastic Brick Moulds',
    description:
      'Reusable moulds for producing hollow plastic bricks and blocks.',
    price: '950',
    currency: 'NPR',
    unit: 'piece',
    images: ['/products/plasticbrickmould.webp'],
    category: 'Moulds',
    soldCount: 2300,
    featured: true,
  },
  {
    slug: 'hdpe-plastic-bags',
    name: 'HDPE Plastic Bags',
    description: 'Durable, lightweight HDPE bags for packaging and retail use.',
    price: '2.50',
    currency: 'NPR',
    unit: 'piece',
    images: [],
    category: 'Packaging',
    soldCount: 1240,
    featured: false,
  },
  {
    slug: 'ldpe-roll-films',
    name: 'LDPE Roll Films',
    description: 'Flexible roll films suitable for wrapping and lamination.',
    price: '15',
    currency: 'NPR',
    unit: 'meter',
    images: [],
    category: 'Packaging',
    soldCount: 860,
    featured: false,
  },
  {
    slug: 'pp-woven-sacks',
    name: 'PP Woven Sacks',
    description:
      'Heavy-duty woven sacks ideal for grains and industrial packaging.',
    price: '25',
    currency: 'NPR',
    unit: 'piece',
    images: [],
    category: 'Packaging',
    soldCount: 2100,
    featured: false,
  },
  {
    slug: 'pvc-pipes-small-dia',
    name: 'PVC Pipes (Small Dia)',
    description: 'High-quality PVC pipes for plumbing and irrigation needs.',
    price: '120',
    currency: 'NPR',
    unit: 'piece',
    images: [],
    category: 'Pipe Fittings',
    soldCount: 540,
    featured: false,
  },
  {
    slug: 'pet-bottles',
    name: 'PET Bottles',
    description: 'Food-grade PET bottles available in various sizes.',
    price: '5',
    currency: 'NPR',
    unit: 'piece',
    images: [],
    category: 'Packaging',
    soldCount: 1780,
    featured: false,
  },
  {
    slug: 'plastic-buckets',
    name: 'Plastic Buckets',
    description: 'Sturdy plastic buckets with strong handles for everyday use.',
    price: '85',
    currency: 'NPR',
    unit: 'piece',
    images: [],
    category: 'Household',
    soldCount: 610,
    featured: false,
  },
  {
    slug: 'plastic-trays',
    name: 'Plastic Trays',
    description: 'Reusable plastic trays perfect for food service and storage.',
    price: '18',
    currency: 'NPR',
    unit: 'piece',
    images: [],
    category: 'Household',
    soldCount: 430,
    featured: false,
  },
  {
    slug: 'packaging-sheets',
    name: 'Packaging Sheets',
    description: 'Clear, tough packaging sheets for protective wrapping.',
    price: '12',
    currency: 'NPR',
    unit: 'piece',
    images: [],
    category: 'Packaging',
    soldCount: 750,
    featured: false,
  },
];

/** Static "sold" figures keyed by product slug. */
export const CATALOG_SOLD_COUNTS: ReadonlyMap<string, number> = new Map(
  PRODUCT_CATALOG.map((product) => [product.slug, product.soldCount]),
);

export const getCatalogSoldCount = (slug: string): number | undefined =>
  CATALOG_SOLD_COUNTS.get(slug);
