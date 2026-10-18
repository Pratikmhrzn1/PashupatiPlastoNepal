import type { Transition } from "framer-motion";

export const SPRING: Transition = {
  type: "spring",
  bounce: 0,
  duration: 0.4,
};

export const SPRING_MOMENTUM: Transition = {
  type: "spring",
  bounce: 0.18,
  duration: 0.42,
};

export const SPRING_SNAPPY: Transition = {
  type: "spring",
  bounce: 0,
  duration: 0.3,
};
