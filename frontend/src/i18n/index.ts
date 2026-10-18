import translations from "./translations.json";

export type Lang = "en" | "ne";

export const DEFAULT_LANG: Lang = "en";

export interface LanguageOption {
  code: Lang;
  label: string;
  short: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English", short: "EN" },
  { code: "ne", label: "नेपाली", short: "ने" },
];

type TranslationLeaf = { en: string; ne: string };

type TranslationPaths<T> = {
  [K in keyof T & string]: T[K] extends TranslationLeaf
    ? K
    : `${K}.${TranslationPaths<T[K]>}`;
}[keyof T & string];

export type TranslationKey = TranslationPaths<typeof translations>;

function isTranslationLeaf(value: unknown): value is TranslationLeaf {
  return (
    typeof value === "object" &&
    value !== null &&
    "en" in value &&
    "ne" in value
  );
}

export function translate(key: TranslationKey, lang: Lang): string {
  let node: unknown = translations;

  for (const segment of key.split(".")) {
    if (typeof node !== "object" || node === null) return key;
    node = (node as Record<string, unknown>)[segment];
  }

  return isTranslationLeaf(node) ? node[lang] : key;
}
