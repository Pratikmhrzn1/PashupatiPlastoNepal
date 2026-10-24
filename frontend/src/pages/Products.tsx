import { useEffect, useState } from "react"
import { useLanguage } from "@/i18n/useLanguage"
import { motion } from "framer-motion"
import { PageMeta } from "@/shared/ui/PageMeta"
import { ProductGridSkeleton } from "@/shared/ui/Skeleton"
import { EmptyState } from "@/shared/ui/States"
import { ProductsGrid } from "@/features/products"
import { PRODUCTS } from "@/features/products/catalog"

export default function Products() {
  const { t } = useLanguage()
  const [isPending, setIsPending] = useState(true)
  const products = PRODUCTS

  useEffect(() => {
    const timeout = window.setTimeout(() => setIsPending(false), 200)
    return () => window.clearTimeout(timeout)
  }, [])

  return (
    <>
      <PageMeta
        title={`${t("sections.products.label")} — Pashupati Plasto Nepal`}
        description={t("sections.products.body")}
      />
      <div className="px-6 pt-28 pb-24 sm:pt-32 sm:pb-20">
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
            {isPending ? (
              <ProductGridSkeleton />
            ) : products.length > 0 ? (
              <ProductsGrid products={products} />
            ) : (
              <EmptyState
                title={t("sections.products.label")}
                description={t("sections.products.body")}
              />
            )}
          </div>
        </motion.div>
      </div>
    </>
  )
}
