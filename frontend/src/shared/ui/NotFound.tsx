import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/useLanguage";
import { PageMeta } from "./PageMeta";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas px-6 text-center">
      <PageMeta title={`404 — ${t("nav.home")}`} />
      <p className="text-sm font-semibold uppercase tracking-widest text-ink-accent">404</p>
      <h1 className="text-3xl font-semibold text-ink sm:text-4xl">
        {t("sections.notFound.label")}
      </h1>
      <p className="max-w-md text-ink-muted">{t("sections.notFound.body")}</p>
      <Link
        to="/"
        className="mt-2 rounded-md bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
      >
        {t("nav.home")}
      </Link>
    </div>
  );
}
