import { createContext } from "react";
import type { Lang, TranslationKey } from "./index";

export const STORAGE_KEY = "pp:lang";

export interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (key: TranslationKey) => string;
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);
