import { lazy, Suspense } from "react"
import { Hero } from "@/features/hero"
import { PageMeta } from "@/shared/ui/PageMeta"
import { Skeleton } from "@/shared/ui/Skeleton"
// Heavy, below-the-fold components → own chunks, loaded on demand.
const MembersSection = lazy(() =>
  import("@/features/members").then((m) => ({ default: m.MembersSection }))
)
const FeaturedProducts = lazy(() =>
  import("@/features/products").then((m) => ({ default: m.FeaturedProducts }))
)
const FindUs = lazy(() =>
  import("@/features/location").then((m) => ({ default: m.FindUs }))
)
export default function Home() {
  return (
    <>
      <PageMeta title="Pashupati Plasto Nepal — Plastics items, Bhaktapur" />
      <Hero />
      <Suspense fallback={<Skeleton className="mx-6 h-[480px] max-w-7xl rounded-2xl xl:mx-auto" />}>
        <MembersSection />
      </Suspense>
      <Suspense fallback={<Skeleton className="mx-6 h-[560px] max-w-7xl rounded-2xl xl:mx-auto" />}>
        <FeaturedProducts />
      </Suspense>
      <Suspense fallback={<Skeleton className="mx-6 h-[480px] max-w-7xl rounded-2xl xl:mx-auto" />}>
        <div id="location" className="scroll-mt-20">
          <FindUs />
        </div>
      </Suspense>
    </>
  )
}
