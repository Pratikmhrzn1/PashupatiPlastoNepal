import { motion } from "framer-motion";

export interface ProductCardProps {
  id: string;
  name: string;
  price: string;
  description: string;
  image?: string;
}

export default function ProductCard({
  name,
  price,
  description,
  image,
}: ProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.995 }}
      whileHover={{ y: -2, scale: 1.002 }}
      transition={{
        type: "spring",
        bounce: 0,
        duration: 0.4,
      }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-charcoal-800/10 bg-surface/95 shadow-sm backdrop-blur transition-shadow will-change-transform focus-within:shadow-md hover:shadow-md dark:border-white/10 dark:hover:shadow-[0_8px_24px_-16px_rgba(0,0,0,0.8)]"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-charcoal-100 dark:bg-white/[0.06]">
        {image ? (
          <motion.img
            src={image}
            alt={name}
            className="h-full w-full object-cover object-center will-change-transform"
            whileHover={{ scale: 1.04 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-muted/50">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-charcoal-900/10 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      </div>
      <div className="flex flex-1 flex-col p-6 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-balance text-lg font-semibold leading-tight text-ink tracking-tight">
            {name}
          </h3>
          <span className="shrink-0 rounded-full bg-primary-600/10 px-2.5 py-0.5 text-xs font-semibold text-ink-accent ring-1 ring-inset ring-primary-600/20 dark:bg-accent-500/10 dark:ring-accent-500/25">
            {price}
          </span>
        </div>
        <p className="mt-2 flex-1 text-pretty text-sm leading-relaxed text-ink-muted">
          {description}
        </p>
      </div>
    </motion.div>
  );
}
