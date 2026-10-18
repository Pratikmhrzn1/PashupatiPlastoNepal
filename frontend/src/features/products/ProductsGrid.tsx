import ProductCard from "./ProductCard";
import type { Product } from "../../constants/products";
import { motion } from "framer-motion";
import { useReducedMotion } from "framer-motion";

interface ProductsGridProps {
  products: Product[];
}

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.08 },
  },
  exit: {
    transition: { staggerChildren: 0.03, staggerDirection: -1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring" as const, bounce: 0, duration: 0.4 },
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: "blur(4px)",
    transition: { duration: 0.15, ease: "easeOut" as const },
  },
};

export default function ProductsGrid({ products }: ProductsGridProps) {
  const reduceMotion = useReducedMotion();

  const variants = reduceMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
        exit: { opacity: 0, transition: { duration: 0.1 } },
      }
    : stagger;

  const itemVariants = reduceMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.2 } },
        exit: { opacity: 0, transition: { duration: 0.1 } },
      }
    : fadeUp;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={variants}
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {products.map((product) => (
        <motion.div key={product.id} variants={itemVariants} className="h-full">
          <ProductCard {...product} />
        </motion.div>
      ))}
    </motion.div>
  );
}
