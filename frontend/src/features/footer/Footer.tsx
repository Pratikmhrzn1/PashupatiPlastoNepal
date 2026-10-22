import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiMapPin, FiPhone } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa6";
import type { IconType } from "react-icons";
import { useLanguage } from "../../i18n/useLanguage";
import { NAV_LINKS } from "../../constants/navLinks";
import { BUSINESS } from "../../constants/business";

interface ContactItem {
  icon: IconType;
  label: string;
  href?: string;
}

const SOCIAL_LINKS = [
  { label: "footer.whatsapp", href: BUSINESS.whatsappHref, Icon: FaWhatsapp },
] as const;

const columnMotion = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
} as const;

export default function Footer() {
  const { t } = useLanguage();

  const contactItems: ContactItem[] = [
    { icon: FiMapPin, label: t("business.location") },
    { icon: FiMapPin, label: t("business.region") },
    { icon: FiPhone, label: BUSINESS.phoneLabel, href: BUSINESS.phoneHref },
  ];

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="w-full border-t border-charcoal-800/10 bg-surface dark:border-white/10"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-12 md:grid-cols-2 md:py-16 lg:grid-cols-4">
        <motion.div
          {...columnMotion}
          transition={{ duration: 0.5, ease: "easeOut" as const }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <img
              src="/images/logo-64.webp"
              alt={t("footer.logoAlt")}
              width={48}
              height={48}
              loading="lazy"
              decoding="async"
              className="size-12 shrink-0 rounded-[13px] object-contain outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
            />
            <span className="text-lg font-semibold text-ink">
              {BUSINESS.short}
            </span>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-ink-muted">
            {t("footer.tagline")}
          </p>
        </motion.div>

        <motion.div
          {...columnMotion}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" as const }}
        >
          <h4 className="mb-5 text-sm font-semibold uppercase text-ink">
            {t("footer.quickLinks")}
          </h4>
          <ul className="space-y-3">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  to={link.href}
                  className="text-sm text-ink-muted transition-colors duration-300 hover:text-ink"
                >
                  {t(link.key)}
                </Link>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          {...columnMotion}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" as const }}
        >
          <h4 className="mb-5 text-sm font-semibold uppercase text-ink">
            {t("footer.contact")}
          </h4>
          <ul className="space-y-3">
            {contactItems.map((item) => {
              const Icon = item.icon;
              const content = (
                <span className="flex items-start gap-3 text-sm text-ink-muted transition-colors duration-300 hover:text-ink">
                  <Icon size={15} className="mt-0.5 shrink-0" />
                  <span>{item.label}</span>
                </span>
              );

              return (
                <li key={item.label}>
                  {item.href ? (
                    <a href={item.href} className="block">
                      {content}
                    </a>
                  ) : (
                    content
                  )}
                </li>
              );
            })}
          </ul>
        </motion.div>

        <motion.div
          {...columnMotion}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" as const }}
        >
          <h4 className="mb-5 text-sm font-semibold uppercase text-ink">
            {t("footer.connect")}
          </h4>
          <div className="mb-8 flex gap-3">
            {SOCIAL_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t(item.label)}
                className="flex size-11 items-center justify-center rounded-full border border-charcoal-800/10 bg-primary-600 text-white transition-transform duration-300 hover:scale-110 hover:bg-primary-700 dark:border-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                <item.Icon size={16} />
              </a>
            ))}
          </div>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center rounded-md border border-charcoal-300 bg-surface px-6 py-3 text-[13px] font-semibold uppercase text-ink shadow-sm transition-[color,background-color,border-color,scale] duration-150 ease-out hover:border-primary-600 hover:bg-primary-600 hover:text-white active:scale-[0.96] dark:border-white/20 dark:bg-white/6 dark:hover:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          >
            {t("footer.cta")}
          </Link>
        </motion.div>
      </div>

      <div className="flex flex-col items-center justify-center gap-3 border-t border-charcoal-800/10 px-6 py-5 sm:flex-row sm:gap-6 dark:border-white/10">
        <p className="text-center text-xs text-ink-muted">
          &copy; {new Date().getFullYear()} {BUSINESS.name}. {t("footer.rights")}
        </p>
      </div>
    </motion.footer>
  );
}
