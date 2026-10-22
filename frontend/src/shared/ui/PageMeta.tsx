import { useEffect } from "react";

interface PageMetaProps {
  title: string;
  description?: string;
}

/**
 * Minimal per-route document title / meta description manager.
 * No external dependency — sets document.title and the existing meta[name=description].
 */
export function PageMeta({ title, description }: PageMetaProps) {
  useEffect(() => {
    document.title = title;

    if (description) {
      let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", description);
    }
  }, [title, description]);

  return null;
}
