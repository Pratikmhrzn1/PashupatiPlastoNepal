import { useState } from "react"
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { FiAlertCircle, FiArrowLeft, FiEye, FiEyeOff, FiLoader, FiLock } from "react-icons/fi"
import { useAdminLogin, useAdminSession } from "@/features/admin/api"
import { inputClass, labelClass, primaryButton } from "@/features/admin/ui"
import { PageMeta } from "@/shared/ui/PageMeta"
import { useBodyClass } from "@/shared/lib/useBodyClass"
import { ApiError } from "@/services/http"

export default function LoginAdmin() {
  useBodyClass("admin-route")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = useAdminLogin()
  const { data: session } = useAdminSession()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as { from?: string } | null)?.from ?? "/admin"

  if (session) {
    return <Navigate to={from} replace />
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    try {
      await login.mutateAsync({ email, password })
      navigate(from, { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Login failed. Check your credentials and try again.")
      }
    }
  }

  return (
    <>
      <PageMeta title="Admin login — Pashupati Plasto Nepal" />
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-5 py-16 sm:px-6">
        <div className="pointer-events-none absolute -top-40 right-[-10%] h-80 w-80 rounded-full bg-primary-600/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-48 left-[-15%] h-[28rem] w-[28rem] rounded-full bg-accent-500/10 blur-3xl" />

        <Link
          to="/"
          className="fixed top-4 left-4 z-20 inline-flex items-center gap-2 rounded-full border border-charcoal-800/10 bg-surface/80 px-3.5 py-2 text-sm font-medium text-ink-muted shadow-sm backdrop-blur-xl transition-[color,background-color,border-color,transform] duration-200 ease-out hover:-translate-y-px hover:border-charcoal-800/20 hover:bg-surface hover:text-ink active:translate-y-0 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600/50 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas dark:border-white/10 dark:bg-surface/70 dark:hover:border-white/20 dark:hover:bg-surface dark:focus-visible:ring-offset-canvas sm:top-6 sm:left-6"
        >
          <FiArrowLeft aria-hidden="true" />
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.5 }}
          className="relative z-10 w-full max-w-md"
        >
          <div className="mb-8 text-center">
            <motion.img
              src="/images/logo-128.webp"
              alt="Pashupati Plasto"
              width={128}
              height={128}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4, delay: 0.05 }}
              className="mx-auto block h-16 w-16 rounded-2xl object-contain shadow-lg shadow-primary-900/10 outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/15"
            />
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-ink">
              Sign in to admin panel
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              Manage products, inquiries and the public catalogue from one place.
            </p>
          </div>

          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.5, delay: 0.08 }}
            onSubmit={(event) => void handleSubmit(event)}
            className="relative overflow-hidden rounded-3xl border border-charcoal-800/10 bg-surface/95 p-7 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_40px_-24px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-surface/90 dark:shadow-[0_1px_1px_rgba(255,255,255,0.02),0_24px_48px_-32px_rgba(0,0,0,0.8)] sm:p-8"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-white/10" />
            <div className="mb-6 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-primary-600/10 text-primary-600 dark:bg-primary-400/15 dark:text-primary-300">
                <FiLock aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">Secure sign in</p>
                <p className="text-xs text-ink-muted">Your session is protected</p>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-800/15 bg-red-50/80 px-4 py-3 text-sm text-red-700 shadow-sm dark:border-red-400/25 dark:bg-red-950/40 dark:text-red-300"
              >
                <FiAlertCircle className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className={labelClass}>
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                autoFocus
                inputMode="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass}
                placeholder="admin@example.com"
              />
            </div>

            <div className="mt-4">
              <label htmlFor="password" className={labelClass}>
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={`${inputClass} pr-12`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute top-1/2 right-1 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full text-ink-muted transition-[color,background-color,transform] duration-150 ease-out hover:bg-charcoal-100 hover:text-ink active:scale-[0.96] dark:hover:bg-white/10"
                >
                  <AnimatePresence initial={false} mode="wait">
                    <motion.span
                      key={showPassword ? "hide" : "show"}
                      initial={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
                      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
                      transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                      className="grid place-items-center"
                    >
                      {showPassword ? (
                        <FiEyeOff aria-hidden="true" />
                      ) : (
                        <FiEye aria-hidden="true" />
                      )}
                    </motion.span>
                  </AnimatePresence>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={login.isPending}
              className={`${primaryButton} mt-6 w-full`}
            >
              {login.isPending ? (
                <>
                  <FiLoader className="animate-spin" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                "Sign in to dashboard"
              )}
            </button>
          </motion.form>
        </motion.div>
      </div>
    </>
  )
}
