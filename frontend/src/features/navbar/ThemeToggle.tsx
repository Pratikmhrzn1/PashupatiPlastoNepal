import { useEffect, useRef, useState } from "react";
import { FiMoon, FiSun } from "react-icons/fi";
import { useLanguage } from "../../i18n/useLanguage";

type Theme = "light" | "dark";

export default function ThemeToggle() {
  const { t } = useLanguage();
  const suppressRef = useRef<HTMLStyleElement | null>(null);
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored === "light" || stored === "dark") return stored;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }

    const style = suppressRef.current;
    if (style) {
      document.body.getBoundingClientRect();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          style.remove();
          suppressRef.current = null;
        });
      });
    }
  }, [theme]);

  const toggle = () => {
    const style = document.createElement("style");
    style.append(
      document.createTextNode("*,*::before,*::after{transition:none !important}")
    );
    document.head.append(style);
    suppressRef.current = style;
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t("actions.switchTheme") || "Switch theme"}
      className="grid size-10 place-items-center rounded-xl border border-charcoal-800/10 bg-charcoal-800/[0.03] text-ink transition-[color,background-color,border-color,scale] duration-150 ease-out hover:border-primary-600/40 hover:bg-primary-600/10 hover:text-primary-700 active:scale-[0.96] dark:border-white/10 dark:bg-white/5 dark:hover:border-primary-400/40 dark:hover:bg-primary-400/10"
    >
      {theme === "dark" ? <FiSun size={18} /> : <FiMoon size={18} />}
    </button>
  );
}
