import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

const worker = setupWorker(...handlers);

/**
 * Start MSW interception (dev/mock mode only).
 * Dynamically imported from main.tsx so the worker + handlers are
 * tree-shaken out of production bundles entirely.
 */
export async function startMocking() {
  if (!import.meta.env.DEV) return;
  await worker.start({
    onUnhandledFrame: "bypass",
    serviceWorker: { url: "/mockServiceWorker.js" },
  });
}
