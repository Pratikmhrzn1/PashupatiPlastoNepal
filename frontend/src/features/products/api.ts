import { getFeaturedProducts, getProducts } from "@/services/api";
import type { ProductDto } from "@/services/types";

/**
 * Products feature — query keys and query functions.
 * Convention: ['<resource>', ...params]. Keys live next to the feature that owns them.
 */
export const productKeys = {
  all: ["products"] as const,
  list: () => [...productKeys.all, "list"] as const,
  featured: () => [...productKeys.all, "featured"] as const,
  detail: (id: string) => [...productKeys.all, id] as const,
};

/** Query function for the product list. Returns DTOs straight from the API layer. */
export function fetchProducts(): Promise<ProductDto[]> {
  return getProducts();
}

/** Query function for the most-bought products (backend ranks and limits). */
export function fetchFeaturedProducts(): Promise<ProductDto[]> {
  return getFeaturedProducts();
}
