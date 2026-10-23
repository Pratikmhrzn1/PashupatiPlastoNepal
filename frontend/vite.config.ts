import { fileURLToPath } from "node:url"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import tailwindcss from "@tailwindcss/vite"
import { visualizer } from "rollup-plugin-visualizer"
import { VitePWA } from "vite-plugin-pwa"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["images/logo-64.png", "images/logo-128.png"],
      manifest: {
        name: "Pashupati Plasto Nepal",
        short_name: "Pashupati",
        description: "Plastic & polymer manufacturing in Bhaktapur, Nepal.",
        theme_color: "#0b3c6f",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/images/logo-192.png", sizes: "192x192", type: "image/png" },
          { src: "/images/logo-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,woff2}"],
        // Images are runtime-cached (CacheFirst) on first use, not precached —
        // precaching 5 MB of images would hurt first visit for little gain.
        globIgnores: ["**/images/**"],
        // Clean up old runtime caches on each new SW version.
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: false, // prompt mode: wait for user to accept the update
        runtimeCaching: [
          {
            // Images: cache-first, big byte savings, rarely change.
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // API GETs: serve cached instantly, refresh in background.
            urlPattern: ({ url, request }) =>
              request.method === "GET" &&
              (url.pathname.startsWith("/api/products") ||
                url.pathname.startsWith("/api/members")),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "api-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Navigations / HTML: network-first, fall back to cached shell.
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "pages-cache",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 },
              networkTimeoutSeconds: 3,
            },
          },
        ],
      },
    }),
    visualizer({ filename: "dist/stats.html", gzipSize: true, brotliSize: true }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("framer-motion")) return "motion"
            if (
              id.includes("/react/") ||
              id.includes("/react-dom/") ||
              id.includes("/react-router")
            ) {
              return "react-vendor"
            }
            return "vendor"
          }
        },
      },
    },
  },
})
