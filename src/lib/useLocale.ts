"use client";

import { useCallback, useEffect, useState } from "react";

export type Locale = "en" | "id";

const STORAGE_KEY = "bts-locale";

export const LOCALES: Locale[] = ["en", "id"];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  id: "ID",
};

/**
 * Lightweight locale preference (cookie + localStorage) read pre-paint by the
 * init script in layout, so the first render already matches. Strings live in
 * src/lib/i18n.ts as flat dictionaries — no runtime i18n dependency needed at
 * this scale.
 */
export function useLocale() {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    void Promise.resolve().then(() => {
      const saved = document.documentElement.lang;
      if (saved === "id" || saved === "en") setLocale(saved);
    });
  }, []);

  const setLocalePersist = useCallback((next: Locale) => {
    setLocale(next);
    document.documentElement.lang = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
      document.cookie = `bts-locale=${next}; path=/; max-age=31536000; samesite=lax`;
    } catch {
      // Private mode; toggle still works for this page view.
    }
  }, []);

  const toggle = useCallback(() => {
    setLocalePersist(locale === "en" ? "id" : "en");
  }, [locale, setLocalePersist]);

  return { locale, setLocale: setLocalePersist, toggle };
}

export const localeInitScript = `(function(){try{var m=document.cookie.match(/bts-locale=(en|id)/);var t=m?m[1]:localStorage.getItem("${STORAGE_KEY}");if(t==="id"||t==="en"){document.documentElement.lang=t;}}catch(e){}})();`;
