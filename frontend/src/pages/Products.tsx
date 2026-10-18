import Navbar from "../features/navbar/navBar";
import MobileBottomNav from "../features/navbar/MobileBottomNav";
import { useLanguage } from "../i18n/useLanguage";
import { motion } from "framer-motion";
import { ProductsGrid } from "../features/products";
import { PRODUCTS } from "../constants/products";

export default function Products() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />
      <main className="px-6 pt-28 pb-24 sm:pt-32 sm:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" as const }}
          className="mx-auto w-full max-w-7xl"
        >
          <div>
            <h1 className="text-3xl font-semibold text-ink sm:text-4xl">
              {t("sections.products.label")}
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-muted">
              {t("sections.products.body")}
            </p>
          </div>
          <div className="mt-10">
            <ProductsGrid products={PRODUCTS} />
          </div>
        </motion.div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
