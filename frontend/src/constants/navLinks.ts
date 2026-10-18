import type { TranslationKey } from "../i18n";

export interface NavLink {
  key: TranslationKey;
  href: string;
}

export const NAV_LINKS: NavLink[] = [
  { key: "nav.home", href: "/" },
  { key: "nav.about", href: "/about" },
  { key: "nav.products", href: "/products" },
  { key: "nav.contact", href: "/contact" },
];
