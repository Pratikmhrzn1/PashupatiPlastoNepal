import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Variants } from "framer-motion";
import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import { useLanguage } from "@/i18n/useLanguage";
import { SPRING } from "@/lib/motion";
import ProductCard from "./ProductCard";
import { FEATURED_PRODUCTS } from "./catalog";
import { ProductGridSkeleton } from "@/shared/ui/Skeleton";
import { EmptyState } from "@/shared/ui/States";

/** Section enters as semantic chunks ~100ms apart: eyebrow → heading → cards → CTA. */
const sectionStagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardRowStagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function FeaturedProducts() {
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);
  const [isPending, setIsPending] = useState(true);
  const products = FEATURED_PRODUCTS;

  useEffect(() => {
    const timeout = window.setTimeout(() => setIsPending(false), 200);
    return () => window.clearTimeout(timeout);
  }, []);

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
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const chunk: Variants = reduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.2 } } }
    : {
        hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
        visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: SPRING },
      };

  return (
    <motion.section
      id="featured"
      aria-labelledby="featured-heading"
      ref={sectionRef}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={sectionStagger}
      className="w-full scroll-mt-20 border-t border-charcoal-800/10 bg-canvas px-4 py-16 sm:px-6 md:py-24 dark:border-white/10"
    >
      <div className="mx-auto max-w-7xl">
        <motion.p
          variants={chunk}
          className="mb-3 text-center text-sm text-ink-muted uppercase"
        >
          {t("sections.featured.eyebrow")}
        </motion.p>
        <motion.h2
          id="featured-heading"
          variants={chunk}
          className="mb-10 text-center text-3xl font-semibold text-ink md:mb-16 md:text-5xl"
        >
          {t("sections.featured.label")}
        </motion.h2>

        {isPending ? (
          <ProductGridSkeleton count={4} />
        ) : products.length > 0 ? (
          <motion.div
            variants={cardRowStagger}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {products.map((product) => (
              <motion.div key={product.id} variants={chunk} className="h-full">
                <ProductCard {...product} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <EmptyState
            title={t("sections.featured.label")}
            description={t("sections.featured.body")}
          />
        )}

        <motion.div variants={chunk} className="mt-12 flex justify-center">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 rounded-md border border-charcoal-300 bg-surface px-6 py-3 text-sm font-semibold text-ink uppercase shadow-sm transition-[color,background-color,border-color,scale] duration-150 ease-out hover:border-primary-600 hover:bg-primary-600 hover:text-white active:scale-[0.96] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 dark:border-white/20 dark:bg-white/6 dark:text-white dark:hover:border-primary-600 dark:hover:bg-primary-600 dark:hover:text-white"
          >
            {t("sections.featured.cta")}
            <FiArrowRight
              aria-hidden="true"
              size={16}
              strokeWidth={2}
              className="transition-transform duration-150 ease-out"
            />
          </Link>
        </motion.div>
      </div>
    </motion.section>
  );
}
