import type { NavLink } from "../../constants/navLinks"
import { useLanguage } from "../../i18n/useLanguage"
import { Link, useLocation } from "react-router-dom"
import { usePrefetchRoute } from "@/app/usePrefetchRoute"

interface NavLinksProps {
  links: NavLink[]
  active?: string
}

function NavItem({ link, isActive }: { link: NavLink; isActive: boolean }) {
  const { t } = useLanguage()
  const { handlers } = usePrefetchRoute(link.href)

  return (
    <Link
      to={link.href}
      aria-current={isActive ? "page" : undefined}
      className={`relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
        isActive ? "text-ink-accent" : "text-ink-muted hover:text-ink"
      }`}
      {...handlers}
    >
      <span className="relative z-10">{t(link.key)}</span>
      {isActive && (
        <span className="absolute inset-0 rounded-full bg-primary-600/10 dark:bg-accent-500/10" />
      )}
    </Link>
  )
}

export function NavLinks({ links }: NavLinksProps) {
  const location = useLocation()

  return (
    <ul className="flex flex-wrap items-center gap-1 rounded-full border border-charcoal-800/10 bg-surface/80 px-2 py-1 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.05]">
      {links.map((link) => {
        const isActive = location.pathname === link.href
        return (
          <li key={link.href}>
            <NavItem link={link} isActive={isActive} />
          </li>
        )
      })}
    </ul>
  )
}
