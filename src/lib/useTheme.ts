"use client";

import { useCallback, useEffect, useState } from "react";

type Theme = "dark" | "light";

const STORAGE_KEY = "bts-theme";

/**
 * Inline script: reads the saved theme before first paint so a light-mode
 * user never sees a dark flash. Lives in the layout head via next/script's
 * beforeInteractive equivalent — kept tiny and dependency-free.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");if(t==="light"||t==="dark"){document.documentElement.dataset.theme=t;}}catch(e){}})();`;

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    // The inline init script already set data-theme pre-paint; sync state
    // post-await to satisfy Next 16's no-sync-setState-in-effect rule.
    void Promise.resolve().then(() => {
      const saved = document.documentElement.dataset.theme;
      if (saved === "light" || saved === "dark") setTheme(saved);
    });
  }, []);

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Private mode; the toggle still works for this page view.
      }
      return next;
    });
  }, []);

  return { theme, toggle };
}
