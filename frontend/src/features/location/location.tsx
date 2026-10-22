import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Variants } from "framer-motion";
import { FiArrowRight, FiClock, FiMapPin, FiNavigation, FiPhone } from "react-icons/fi";
import type { IconType } from "react-icons";
import { useLanguage } from "@/i18n/useLanguage";
import { BUSINESS } from "@/config/site";
import { SPRING } from "@/lib/motion";

export interface FindUsProps {
  /** Street address shown in the details list and used to locate the pin. */
  address?: string;
  /** Optional pin coordinates; when omitted the address is geocoded by Google Maps. */
  lat?: number;
  lng?: number;
  /** Override the generated Google Maps embed URL. */
  mapEmbedSrc?: string;
  /** Phone number, displayed and linked via `tel:`. */
  phone?: string;
  /** Opening hours, one entry per line. */
  hours?: string[];
}

interface DetailItem {
  icon: IconType;
  label: string;
  value: string;
  href?: string;
}

const MAP_EMBED_BASE = "https://maps.google.com/maps";
const MAP_DIRECTIONS_BASE = "https://www.google.com/maps/dir/";

export default function FindUs({
  address,
  lat,
  lng,
  mapEmbedSrc,
  phone = BUSINESS.phoneLabel,
  hours,
}: FindUsProps) {
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const resolvedAddress = address ?? t("business.location");
  const resolvedHours = hours ?? [t("location.hoursValue")];

  /**
   * The map pin and the directions link are keyed to a language-neutral
   * location, so switching language never changes the iframe src and the
   * embedded map is not reloaded.
   */
  const mapQuery = lat !== undefined && lng !== undefined ? `${lat},${lng}` : (address ?? BUSINESS.address);

  const embedSrc = useMemo(
    () =>
      mapEmbedSrc ??
      `${MAP_EMBED_BASE}?q=${encodeURIComponent(mapQuery)}&z=15&output=embed`,
    [mapEmbedSrc, mapQuery],
  );

  const directionsHref = useMemo(
    () => `${MAP_DIRECTIONS_BASE}?api=1&destination=${encodeURIComponent(mapQuery)}`,
    [mapQuery],
  );

  const details: DetailItem[] = [
    { icon: FiMapPin, label: t("location.address"), value: resolvedAddress },
    { icon: FiClock, label: t("location.hours"), value: resolvedHours.join(", ") },
    {
      icon: FiPhone,
      label: t("location.phone"),
      value: phone,
      href: `tel:${phone.replace(/[^\d+]/g, "")}`,
    },
  ];

  const stagger: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
  };

  const chunk: Variants = reduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.2 } } }
    : {
        hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
        visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: SPRING },
      };

  return (
    <motion.section
      id="find-us"
      aria-labelledby="find-us-heading"
      ref={sectionRef}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={stagger}
      className="w-full scroll-mt-20 border-t border-charcoal-800/10 bg-surface px-6 py-16 md:py-24 dark:border-white/10"
    >
      <div className="mx-auto max-w-7xl">
        <motion.p
          variants={chunk}
          className="mb-3 text-center text-sm text-ink-muted uppercase"
        >
          {t("location.eyebrow")}
        </motion.p>
        <motion.h2
          id="find-us-heading"
          variants={chunk}
          className="mb-16 text-center text-3xl font-semibold text-ink md:text-5xl"
        >
          {t("location.title")}
        </motion.h2>

        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-8">
          {/* Left column — details */}
          <motion.div
            variants={chunk}
            className="mx-auto flex w-full max-w-md flex-col justify-center self-center md:mx-0"
          >
            <ul className="space-y-8">
              {details.map((detail) => {
                const Icon = detail.icon;
                return (
                  <li key={detail.label} className="flex items-start gap-5">
                    <Icon
                      size={24}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-ink-muted"
                    />
                    <div>
                      <p className="mb-2 text-sm text-ink-muted uppercase">
                        {detail.label}
                      </p>
                      {detail.href ? (
                        <a
                          href={detail.href}
                          className="text-base leading-relaxed text-ink transition-colors duration-300 hover:text-ink-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                        >
                          {detail.value}
                        </a>
                      ) : (
                        <p className="text-base leading-relaxed text-ink">{detail.value}</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Get Directions button */}
            <div className="mt-8">
              <a
                href={directionsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex w-full items-center justify-center gap-3 rounded-md bg-primary-600 px-6 py-3.5 text-xs font-semibold text-white uppercase shadow-sm transition-[background-color,scale] duration-150 ease-out hover:bg-primary-700 active:scale-[0.96] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 sm:w-auto sm:px-8 sm:py-4 sm:text-sm"
              >
                <FiNavigation size={18} aria-hidden="true" />
                {t("location.directions")}
                <FiArrowRight
                  size={16}
                  aria-hidden="true"
                  className="transition-transform duration-150 ease-out group-hover:translate-x-1"
                />
              </a>
            </div>
          </motion.div>

          {/* Right column — map */}
          <motion.div
            variants={chunk}
            className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-charcoal-800/10 dark:border-white/10"
          >
            <iframe
              src={embedSrc}
              width="100%"
              height="100%"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 h-full w-full"
              title={t("location.mapTitle")}
              style={{ border: 0 }}
            />
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
