import { Link, useRouteError, isRouteErrorResponse } from "react-router-dom";
import { useLanguage } from "@/i18n/useLanguage";

/**
 * Router `errorElement`. Renders a friendly error state with a retry/home link.
 * Also serves as the visual fallback for thrown route-level errors.
 */
export function RouteError() {
  const error = useRouteError();
  const { t } = useLanguage();

  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : "Unknown error";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas px-6 text-center">
      <h1 className="text-3xl font-semibold text-ink">
        {t("sections.error.label")}
      </h1>
      <p className="max-w-md text-ink-muted">{message}</p>
      <Link
        to="/"
        className="mt-2 rounded-md bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
      >
        {t("nav.home")}
      </Link>
    </div>
  );
}

/** Top-level error boundary for errors thrown outside the router (e.g. provider failures). */
import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas px-6 text-center">
          <h1 className="text-3xl font-semibold text-ink">Something went wrong</h1>
          <p className="max-w-md text-ink-muted">{this.state.error?.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 rounded-md bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
