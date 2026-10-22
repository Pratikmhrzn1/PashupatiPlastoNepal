import { motion } from "framer-motion"
import { useLanguage } from "../../i18n/useLanguage"
import { fadeUp } from "./variants"

export default function HeroContent() {
  const { t } = useLanguage()

  return (
    <div>
      <motion.p
        variants={fadeUp}
        className="sm:text-xs md:text-2xl font-semibold uppercase tracking-wide text-ink-accent"
      >
        {t("hero.eyebrow")}
      </motion.p>
      <motion.h1
        variants={fadeUp}
        className="mt-5 text-4xl font-semibold text-ink sm:text-5xl lg:text-6xl"
      >
        {t("hero.title")}
      </motion.h1>
      <motion.p variants={fadeUp} className="mt-6 max-w-xl text-lg leading-relaxed text-ink-muted">
        {t("hero.subtitle")}
      </motion.p>
      <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-4">
        <a
          href="tel:9849966097"
          className="inline-flex items-center justify-center rounded-md bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-[color,background-color,scale] duration-150 ease-out hover:bg-primary-700 active:scale-[0.96] active:bg-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
        >
          {t("buttons.call")}
        </a>
        <a
          href="/about"
          className="inline-flex items-center justify-center rounded-md border border-charcoal-300 bg-surface px-6 py-3 text-sm font-semibold text-ink shadow-sm transition-[color,background-color,border-color,scale] duration-150 ease-out hover:bg-charcoal-50 active:scale-[0.96] dark:border-white/20 dark:bg-white/6 dark:hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
        >
          {t("buttons.about")}
        </a>
      </motion.div>
    </div>
  )
}
