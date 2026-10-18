import type { Variants } from "framer-motion";
import { SPRING } from "../../lib/motion";

export const staggerGroup: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: SPRING },
};
