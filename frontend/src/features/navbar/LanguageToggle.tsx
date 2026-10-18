import { useId } from "react";
import { motion } from "framer-motion";
import { FiGlobe } from "react-icons/fi";
import { LANGUAGES } from "../../i18n";
import { useLanguage } from "../../i18n/useLanguage";
import { SPRING_SNAPPY } from "../../lib/motion";

interface LanguageToggleProps {
  full?: boolean;
  className?: string;
}

export default function LanguageToggle({
  full = false,
  className = "",
}: LanguageToggleProps) {
  const { lang, setLang, t } = useLanguage();
  const indicatorId = useId();

  return (
    <div
      role="group"
      aria-label={t("actions.switchLanguage")}
      className={`inline-flex items-center gap-0.5 rounded-full bg-charcoal-800/[0.04] p-0.5 ring-1 ring-inset ring-charcoal-800/10 dark:bg-white/[0.06] dark:ring-white/10 ${
        full ? "w-full" : ""
      } ${className}`}
    >
      <FiGlobe
        size={13}
        aria-hidden="true"
        className="ms-1.5 me-0.5 shrink-0 text-ink-muted/70"
      />
      {LANGUAGES.map((option) => {
        const isActive = option.code === lang;

        return (
          <button
            key={option.code}
            type="button"
            onClick={() => setLang(option.code)}
            aria-pressed={isActive}
            className={`relative rounded-full px-2.5 py-1.5 text-xs font-semibold transition-[color,background-color,scale] duration-150 ease-out active:scale-[0.96] ${
              full ? "flex-1" : ""
            } ${
              isActive
                ? "text-white"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId={`language-active-${indicatorId}`}
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-primary-600 ring-1 ring-inset ring-white/20"
                transition={SPRING_SNAPPY}
              />
            )}
            <span className="relative z-10">{option.short}</span>
          </button>
        );
      })}
    </div>
  );
}
