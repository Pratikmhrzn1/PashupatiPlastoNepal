/**
 * Web Vitals reporting. Targets: LCP < 2.5s, CLS < 0.1, INP < 200ms.
 * web-vitals is dynamically imported so it never blocks the critical path.
 * Logs in dev; the callback is the hook point for a future analytics beacon.
 */
export function reportWebVitals() {
  void import("web-vitals").then(({ onCLS, onINP, onLCP }) => {
    const report = (metric: { name: string; value: number; rating?: string }) => {
      if (import.meta.env.DEV) {
        console.info(
          `[web-vitals] ${metric.name}: ${metric.value.toFixed(1)}${metric.rating ? ` (${metric.rating})` : ""}`,
        );
      }
      // Future: navigator.sendBeacon("/api/vitals", JSON.stringify(metric))
    };

    onLCP(report);
    onCLS(report);
    onINP(report);
  });
}
