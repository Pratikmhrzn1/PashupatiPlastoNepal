import { Navigate, Outlet, useLocation } from "react-router-dom"
import { motion } from "framer-motion"
import { useAdminSession } from "./api"

/** Blocks admin routes until a valid session cookie is confirmed by the API. */
export function RequireAdmin() {
  const { data, isPending, isError } = useAdminSession()
  const location = useLocation()

  if (isPending) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas">
        <div className="pointer-events-none absolute -top-40 right-[-10%] h-80 w-80 rounded-full bg-primary-600/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-48 left-[-15%] h-[28rem] w-[28rem] rounded-full bg-accent-500/10 blur-3xl" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", bounce: 0, duration: 0.4 }}
          className="relative z-10 flex flex-col items-center gap-3"
        >
          <div
            role="status"
            aria-label="Checking admin session"
            className="h-9 w-9 animate-spin rounded-full border-2 border-primary-600/20 border-t-primary-600"
          />
          <p className="text-sm text-ink-muted">Verifying session…</p>
        </motion.div>
      </div>
    )
  }

  if (isError || !data) {
    return <Navigate to="/login-admin" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
