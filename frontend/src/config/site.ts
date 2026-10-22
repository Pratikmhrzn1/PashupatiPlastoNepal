/**
 * Single source of truth for business contact info.
 * (The legacy `constants/business.ts` re-exports from here for backwards compatibility.)
 * Values preserved exactly from the original constants/business.ts.
 */
export const BUSINESS = {
  name: "Pashupati Plasto Nepal",
  short: "Pashupati Plasto",
  phoneLabel: "+977 9765559612",
  phoneHref: "tel:+9779765559612",
  whatsappHref: "https://wa.me/9849966097",
  /**
   * Language-neutral address (English form) used for map embeds and
   * directions links. The UI shows the localized `business.location`
   * translation instead — keeping this value stable means switching
   * language never reloads the embedded map.
   */
  address: "Suryabinayak-2, Bhaktapur",
} as const;
