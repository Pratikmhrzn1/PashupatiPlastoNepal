import { motion } from "framer-motion"
import { staggerGroup } from "./variants"
import HeroContent from "./HeroContent"
import HeroMedia from "./HeroMedia"

export default function Hero() {
  return (
    <section
      id="home"
      className="relative flex items-center overflow-hidden pt-28 pb-20 sm:pt-32 sm:pb-16"
    >
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerGroup}
        className="mx-auto grid w-full max-w-7xl items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16 lg:px-8"
      >
        <HeroContent />
        <HeroMedia />
      </motion.div>
    </section>
  )
}
