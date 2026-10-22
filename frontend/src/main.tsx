import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./app/App"
import { AppErrorBoundary } from "./shared/ui/RouteError"
import { MotionConfig } from "framer-motion"
import { LanguageProvider } from "./i18n/LanguageProvider"
import { isMockMode } from "./config/env"
import { reportWebVitals } from "./shared/lib/webVitals"

// Start MSW in dev/mock mode before rendering so the first fetch is intercepted.
// Dynamic import keeps MSW + handlers out of production bundles entirely.
async function bootstrap() {
  if (isMockMode() && import.meta.env.DEV) {
    const { startMocking } = await import("./services/mock/browser")
    await startMocking()
  }

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <AppErrorBoundary>
        <LanguageProvider>
          <MotionConfig reducedMotion="user">
            <App />
          </MotionConfig>
        </LanguageProvider>
      </AppErrorBoundary>
    </StrictMode>
  )

  reportWebVitals()
}

void bootstrap()
