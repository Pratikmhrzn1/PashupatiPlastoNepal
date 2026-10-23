import { useState } from "react"
import { motion } from "framer-motion"
import { FiInbox, FiPackage } from "react-icons/fi"
import { AdminHeader, InquiriesPanel, ProductsPanel } from "@/features/admin"
import { PageMeta } from "@/shared/ui/PageMeta"
import { useBodyClass } from "@/shared/lib/useBodyClass"

type Tab = "inquiries" | "products"

const TABS: { id: Tab; label: string; icon: typeof FiInbox }[] = [
  { id: "inquiries", label: "Inquiries", icon: FiInbox },
  { id: "products", label: "Products", icon: FiPackage },
]

export default function Admin() {
  useBodyClass("admin-route")
  const [tab, setTab] = useState<Tab>("inquiries")

  return (
    <>
      <PageMeta title="Admin — Pashupati Plasto Nepal" />
      <div className="relative min-h-screen overflow-hidden bg-canvas">
        <div className="pointer-events-none absolute -top-32 right-[-10%] h-72 w-72 rounded-full bg-primary-600/8 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-[-15%] h-[24rem] w-[24rem] rounded-full bg-accent-500/8 blur-3xl" />
        <div className="relative z-10">
          <AdminHeader />

          <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="flex flex-wrap items-end justify-between gap-4"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-600/80 dark:text-primary-300/80">
                  Overview
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                  Dashboard
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-ink-muted">
                  Triage inquiries and curate the live catalogue with a focused, responsive
                  workspace.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4, delay: 0.05 }}
              role="tablist"
              aria-label="Admin sections"
              className="mt-8 inline-flex rounded-full border border-charcoal-800/10 bg-surface/90 p-1 shadow-sm backdrop-blur dark:border-white/10 dark:bg-surface/80"
            >
              {TABS.map((item) => {
                const Icon = item.icon
                const active = tab === item.id

                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTab(item.id)}
                    className={`relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                      active ? "text-white" : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="admin-tab-pill"
                        className="absolute inset-0 rounded-full bg-primary-600 shadow-sm shadow-primary-600/20"
                        transition={{ type: "spring", bounce: 0, duration: 0.35 }}
                      />
                    )}
                    <Icon className="relative z-10" aria-hidden="true" />
                    <span className="relative z-10">{item.label}</span>
                  </button>
                )
              })}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4, delay: 0.08 }}
              className="mt-6"
            >
              {tab === "inquiries" ? <InquiriesPanel /> : <ProductsPanel />}
            </motion.div>
          </div>
        </div>
      </div>
    </>
  )
}
