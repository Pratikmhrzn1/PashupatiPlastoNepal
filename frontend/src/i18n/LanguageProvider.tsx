import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { DEFAULT_LANG, LANGUAGES, translate } from "./index";
import type { Lang, TranslationKey } from "./index";
import { LanguageContext, STORAGE_KEY } from "./context";
import type { LanguageContextValue } from "./context";

function getInitialLang(): Lang {
  if (typeof window === "undefined") return DEFAULT_LANG;

  const stored = window.localStorage.getItem(STORAGE_KEY);
  return LANGUAGES.some((option) => option.code === stored)
    ? (stored as Lang)
    : DEFAULT_LANG;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(getInitialLang);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback((key: TranslationKey) => translate(key, lang), [lang]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang,
      toggleLang: () => setLang((prev) => (prev === "en" ? "ne" : "en")),
      t,
    }),
    [lang, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
