import { Suspense, useEffect, useRef } from "react";
import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import Navbar from "@/features/navbar/navBar";
import MobileBottomNav from "@/features/navbar/MobileBottomNav";
import { Footer } from "@/features/footer";
import { FloatingContactButton } from "@/shared/floating";
import { PageSkeleton } from "@/shared/ui/Skeleton";

/**
 * Shared shell for all routes: skip-link, Navbar, page content (Suspense),
 * Footer, and the single MobileBottomNav (rendered here once, not per-page).
 * Also handles focus management on route change for screen readers.
 */
export default function Layout() {
  const location = useLocation();
  const mainRef = useRef<HTMLElement | null>(null);
  const firstRender = useRef(true);

  // Move focus to <main> on every route change (skip the very first mount).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    mainRef.current?.focus();
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-canvas">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:bg-primary-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>
      <Navbar />
      <ScrollRestoration />
      <main id="main-content" ref={mainRef} tabIndex={-1} className="outline-none">
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <FloatingContactButton />
      <MobileBottomNav />
    </div>
  );
}
