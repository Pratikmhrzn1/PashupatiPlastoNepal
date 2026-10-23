import { useEffect } from "react";

/** Adds a class to <body> for the lifetime of the component. */
export function useBodyClass(className: string) {
  useEffect(() => {
    document.body.classList.add(className);

    return () => {
      document.body.classList.remove(className);
    };
  }, [className]);
}
