import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { FiArrowLeft, FiLogOut } from "react-icons/fi"
import { useAdminLogout, useAdminSession } from "./api"

export function AdminHeader() {
  const { data: admin } = useAdminSession()
  const logout = useAdminLogout()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout.mutateAsync()
    } finally {
      navigate("/login-admin", { replace: true })
    }
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", bounce: 0, duration: 0.4 }}
      className="sticky top-0 z-40 border-b border-white/10 bg-primary-600/95 text-white shadow-[0_1px_0_rgba(255,255,255,0.06),0_8px_24px_-12px_rgba(2,6,23,0.5)] backdrop-blur-xl supports-[backdrop-filter]:bg-primary-600/80"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-600"
          >
            <FiArrowLeft aria-hidden="true" />
          </Link>
          <span className="h-6 w-px bg-white/20" aria-hidden="true" />
          <Link
            to="/admin"
            aria-label="Pashupati Plasto admin panel"
            className="flex items-center gap-2.5 rounded-xl transition-transform duration-150 ease-out active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-600"
          >
            <img
              src="/images/logo-64.webp"
              alt=""
              width={60}
              height={60}
              className="size-9 shrink-0 rounded-[11px] object-contain outline outline-1 -outline-offset-1 outline-white/25"
            />
            <div className="hidden sm:block">
              <p className="text-sm font-semibold tracking-tight">Pashupati Plasto</p>
              <p className="text-xs text-white/70">Admin panel</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {admin && (
            <span className="hidden rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 sm:block">
              {admin.email}
            </span>
          )}
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={logout.isPending}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur transition-[transform,background-color,border-color] duration-200 hover:-translate-y-px hover:border-white/30 hover:bg-white/20 active:translate-y-0 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-600"
          >
            <FiLogOut aria-hidden="true" />
            {logout.isPending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>
    </motion.header>
  )
}
