import type { ProductDto } from "@/services/types";

/** Static public catalog used by the marketing pages. */
export interface CatalogProduct extends ProductDto {
  featured: boolean;
}

export const PRODUCTS: CatalogProduct[] = [
  {
    id: "safety-helmets",
    name: "Safety Helmets",
    price: "NPR 450 / piece",
    description: "Injection-moulded ABS safety helmets for industrial and site use.",
    image: "/products/helmet.webp",
    soldCount: 3200,
    featured: true,
  },
  {
    id: "oem-pipe-fittings",
    name: "OEM Pipe Fittings",
    price: "NPR 180 / piece",
    description: "Custom-moulded OEM fittings produced to client drawings and tolerances.",
    image: "/products/oempipefitting.webp",
    soldCount: 2800,
    featured: true,
  },
  {
    id: "pipe-clamps",
    name: "Pipe Clamps",
    price: "NPR 65 / piece",
    description: "Durable PP clamps for joining and securing pipeline sections.",
    image: "/products/pipeclamp.webp",
    soldCount: 2400,
    featured: true,
  },
  {
    id: "plastic-brick-moulds",
    name: "Plastic Brick Moulds",
    price: "NPR 950 / piece",
    description: "Reusable moulds for producing hollow plastic bricks and blocks.",
    image: "/products/plasticbrickmould.webp",
    soldCount: 2300,
    featured: true,
  }
];

export const FEATURED_PRODUCTS = PRODUCTS.filter((product) => product.featured);
