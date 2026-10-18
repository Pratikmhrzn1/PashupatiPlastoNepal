import Navbar from "../features/navbar/navBar";
import MobileBottomNav from "../features/navbar/MobileBottomNav";
import { useLanguage } from "../i18n/useLanguage";
import { motion } from "framer-motion";

export default function Contact() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />
      <main className="flex min-h-screen items-center justify-center px-6 pt-28 pb-20 sm:pt-32 sm:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.4 }}
          className="w-full max-w-xl"
        >
          <div className="rounded-2xl border border-charcoal-800/10 bg-surface/95 p-8 shadow-sm backdrop-blur dark:border-white/10">
            <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {t("sections.contact.label")}
            </h1>
            <p className="mt-4 text-pretty text-ink-muted">
              {t("sections.contact.body")}
            </p>
            <form className="mt-8 space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-ink">
                  {t("contact.name") || "Name"}
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="mt-2 block w-full rounded-md border border-charcoal-300 px-3 py-2 text-ink shadow-sm transition-colors dark:border-white/15 dark:bg-white/[0.04] placeholder:text-ink-muted/60 focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600"
                  placeholder={t("contact.namePlaceholder") || "Your name"}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-ink">
                  {t("contact.email") || "Email"}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="mt-2 block w-full rounded-md border border-charcoal-300 px-3 py-2 text-ink shadow-sm transition-colors dark:border-white/15 dark:bg-white/[0.04] placeholder:text-ink-muted/60 focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600"
                  placeholder={t("contact.emailPlaceholder") || "your@email.com"}
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-ink">
                  {t("contact.phone") || "Phone"}
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="mt-2 block w-full rounded-md border border-charcoal-300 px-3 py-2 text-ink shadow-sm transition-colors dark:border-white/15 dark:bg-white/[0.04] placeholder:text-ink-muted/60 focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600"
                  placeholder={t("contact.phonePlaceholder") || "98XXXXXXXX"}
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-ink">
                  {t("contact.message") || "Message"}
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  className="mt-2 block w-full rounded-md border border-charcoal-300 px-3 py-2 text-ink shadow-sm transition-colors dark:border-white/15 dark:bg-white/[0.04] placeholder:text-ink-muted/60 focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600"
                  placeholder={t("contact.messagePlaceholder") || "Your message..."}
                />
              </div>
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-md bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 active:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                {t("contact.send") || "Send Message"}
              </button>
            </form>
          </div>
        </motion.div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
