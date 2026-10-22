import { motion } from "framer-motion"
import { useLanguage } from "../../i18n/useLanguage"
import { fadeUp } from "./variants"

export default function HeroMedia() {
  const { t } = useLanguage()

  return (
    <motion.div variants={fadeUp} className="relative">
      {/* LCP element: eager + high priority, modern formats with srcset.
          AVIF → WebP → PNG fallback chain. Explicit dimensions prevent CLS. */}
      <picture>
        <source
          type="image/avif"
          srcSet="/images/hero-640.avif 640w, /images/hero-1024.avif 1024w"
          sizes="(max-width: 768px) 100vw, 45vw"
        />
        <source
          type="image/webp"
          srcSet="/images/hero-640.webp 640w, /images/hero-1024.webp 1024w"
          sizes="(max-width: 768px) 100vw, 45vw"
        />
        <img
          src="/images/hero.png"
          alt={t("hero.imageAlt")}
          width={1024}
          height={1536}
          fetchPriority="high"
          decoding="async"
          className="mx-auto w-full max-w-[calc((100svh-12rem)/1.5)]"
        />
      </picture>
    </motion.div>
  )
}
