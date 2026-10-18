import Navbar from "../features/navbar/navBar";
import MobileBottomNav from "../features/navbar/MobileBottomNav";
import { useLanguage } from "../i18n/useLanguage";
import { motion } from "framer-motion";

export default function About() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />
      <main className="flex min-h-screen items-center justify-center px-6 pt-28 pb-20 sm:pt-32 sm:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" as const }}
          className="w-full max-w-3xl"
        >
          <div className="rounded-2xl border border-charcoal-800/10 bg-surface p-8 shadow-sm dark:border-white/10">
            <h1 className="text-3xl font-semibold text-ink sm:text-4xl">
              {t("sections.about.label")}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-ink-muted">
              {t("sections.about.body")}
            </p>
          </div>
        </motion.div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
