import { useQuery } from "@tanstack/react-query";
import { fetchProducts, productKeys } from "./api";

/**
 * Cached product list.
 * staleTime (5 min, from QueryClient defaults) means repeat visits within the
 * freshness window render instantly from cache with zero network requests.
 */
export function useProducts() {
  return useQuery({
    queryKey: productKeys.list(),
    queryFn: fetchProducts,
  });
}
