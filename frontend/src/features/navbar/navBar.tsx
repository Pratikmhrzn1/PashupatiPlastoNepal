import { useEffect, useState } from "react";
import { useScroll } from "framer-motion";
import { NAV_LINKS } from "../../constants/navLinks";
import { BUSINESS } from "../../constants/business";
import { useLanguage } from "../../i18n/useLanguage";
import LanguageToggle from "./LanguageToggle";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import { NavLinks } from "./NavLinks";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const { t } = useLanguage();

  useEffect(() => {
    const unsubscribe = scrollY.on("change", (latest) => {
      setScrolled(latest > 24);
    });
    return () => unsubscribe();
  }, [scrollY]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4">
      <div
        data-material="glass"
        className={`relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 rounded-2xl border px-4 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-150 ease-out sm:px-6 lg:px-8 ${
          scrolled
            ? "border-charcoal-800/10 bg-surface/85 shadow-[0_12px_32px_-22px_rgba(43,47,54,0.55)] backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/5 dark:shadow-[0_12px_32px_-22px_rgba(0,0,0,0.8)]"
            : "border-transparent bg-transparent"
        }`}
      >
        <a
          href="/"
          aria-label={BUSINESS.name}
          className="flex shrink-0 items-center rounded-xl transition-transform duration-150 ease-out active:scale-[0.96]"
        >
          <Logo />
        </a>

        <nav className="hidden md:block" aria-label={t("actions.mainNav")}>
          <NavLinks links={NAV_LINKS} />
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
