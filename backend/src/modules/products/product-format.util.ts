/**
 * Formatting helpers that turn database values into the wire format the
 * frontend expects (see `frontend/src/services/types.ts`).
 */

const ABSOLUTE_URL_PATTERN = /^(https?:)?\/\//i;

const stripTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

/**
 * Formats a price the way the frontend mock does: integer amounts without
 * decimals ("NPR 450"), fractional amounts with two decimals ("NPR 2.50"),
 * optionally followed by the selling unit ("NPR 450 / piece").
 */
export const formatProductPrice = (
  price: number | null | undefined,
  currency: string | null | undefined,
  unit: string | null | undefined,
): string => {
  if (price === null || price === undefined) {
    return '';
  }

  const amount = Number.isInteger(price) ? String(price) : price.toFixed(2);
  const currencyCode = (currency ?? 'NPR').trim().toUpperCase();
  const unitSuffix = unit ? ` / ${unit.trim()}` : '';

  return `${currencyCode} ${amount}${unitSuffix}`;
};

/**
 * Resolves the first image of a product into a URL the browser can load.
 * Relative paths (e.g. "/products/helmet.webp") are resolved against the
 * frontend origin.
 */
export const resolveProductImage = (
  images: string[],
  frontendUrl?: string | null,
): string | undefined => {
  const [first] = images;

  if (!first) {
    return undefined;
  }

  if (ABSOLUTE_URL_PATTERN.test(first) || first.startsWith('data:')) {
    return first;
  }

  if (!first.startsWith('/')) {
    return first;
  }

  if (!frontendUrl) {
    return first;
  }

  return `${stripTrailingSlash(frontendUrl)}${first}`;
};
