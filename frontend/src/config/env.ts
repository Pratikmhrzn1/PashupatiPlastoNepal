import { z } from "zod/v4/mini";

/**
 * Centralized, validated environment config.
 * Access via `import { env } from "@/config/env"` — never read import.meta.env directly.
 * Uses zod/v4/mini to keep the bundle small (~half the size of full zod).
 */
const envSchema = z.object({
  VITE_API_MODE: z.optional(z.enum(["mock", "live"])),
  VITE_API_BASE_URL: z.optional(z.url()),
});

const parsed = envSchema.safeParse({
  VITE_API_MODE: import.meta.env.VITE_API_MODE,
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
});

if (!parsed.success) {
  // Fail fast in dev; in prod we degrade gracefully to defaults.
  console.error(
    "Invalid environment variables:",
    parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
  );
  throw new Error("Invalid environment configuration");
}

export const env = {
  VITE_API_MODE: parsed.data.VITE_API_MODE ?? "mock",
  VITE_API_BASE_URL: parsed.data.VITE_API_BASE_URL,
};

/** True when the app should intercept requests with MSW. */
export const isMockMode = () => env.VITE_API_MODE === "mock";

/** Base URL for the real API (same-origin in single-project deployment). */
export const apiBaseUrl = () =>
  env.VITE_API_MODE === "live"
    ? (env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "")
    : "";
