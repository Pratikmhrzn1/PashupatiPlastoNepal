import { FiHome, FiInfo, FiPackage, FiPhone } from "react-icons/fi";
import { NAV_LINKS } from "../../constants/navLinks";
import { useLanguage } from "../../i18n/useLanguage";
import { Link, useLocation } from "react-router-dom";

const ICONS: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  home: FiHome,
  about: FiInfo,
  products: FiPackage,
  contact: FiPhone,
};

export default function MobileBottomNav() {
  const { t } = useLanguage();
  const location = useLocation();

  const mobileLinks = NAV_LINKS.filter((link) =>
    ["/", "/about", "/products", "/contact"].includes(link.href),
  );

  return (
    <nav
      aria-label={t("actions.mainNav")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-charcoal-800/10 bg-surface/95 backdrop-blur-xl dark:border-white/10 backdrop-saturate-150 md:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2 py-1">
        {mobileLinks.map((link) => {
          const isActive = location.pathname === link.href;
          const id = link.href === "/" ? "home" : link.href.slice(1);
          const Icon = ICONS[id] || FiHome;

          return (
            <li key={link.href} className="flex-1">
              <Link
                to={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-xs transition-colors ${
                  isActive
                    ? "text-ink-accent"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                <Icon size={18} />
                <span className="font-medium">{t(link.key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
