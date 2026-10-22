import { useQuery } from "@tanstack/react-query";
import { fetchFeaturedProducts, productKeys } from "./api";

/**
 * Most-bought products, ranked server-side.
 * Separate key from the full list so the featured section and the Products
 * page cache independently and dedupe their in-flight requests separately.
 */
export function useFeaturedProducts() {
  return useQuery({
    queryKey: productKeys.featured(),
    queryFn: fetchFeaturedProducts,
  });
}
