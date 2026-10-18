import { motion } from "framer-motion";
import { useLanguage } from "../../i18n/useLanguage";
import { fadeUp } from "./variants";

export default function HeroMedia() {
  const { t } = useLanguage();

  return (
    <motion.div variants={fadeUp} className="relative">
      <img
        src="/hero.png"
        alt={t("hero.imageAlt")}
        width={1024}
        height={1536}
        className="mx-auto w-full max-w-[calc((100svh_-_12rem)/1.5)] rounded-2xl shadow-[0_24px_60px_-24px_rgba(11,60,111,0.35)] outline outline-1 -outline-offset-1 outline-black/10 dark:shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)] dark:outline-white/10"
      />
    </motion.div>
  );
}
