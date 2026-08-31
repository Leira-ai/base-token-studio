"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Locale = "en" | "id";

const STORAGE_KEY = "bts-locale";

export const LOCALES: Locale[] = ["en", "id"];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  id: "ID",
};

type LocaleContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  toggle: () => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function persist(next: Locale) {
  document.documentElement.lang = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
    document.cookie = `bts-locale=${next}; path=/; max-age=31536000; samesite=lax`;
  } catch {
    // Private mode; the toggle still works for this page view.
  }
}

/**
 * One shared locale state for the whole tree. The earlier per-hook version
 * kept three independent copies (page, toggle, create panel), so clicking the
 * toggle visibly updated nothing. Persisted to localStorage + a cookie that
 * the pre-paint init script reads.
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    void Promise.resolve().then(() => {
      const saved = document.documentElement.lang;
      if (saved === "id" || saved === "en") setLocaleState(saved);
    });
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    persist(next);
  }, []);

  const toggle = useCallback(() => {
    setLocaleState((current) => {
      const next: Locale = current === "en" ? "id" : "en";
      persist(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ locale, setLocale, toggle }),
    [locale, setLocale, toggle],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const value = useContext(LocaleContext);
  if (!value) {
    throw new Error("useLocale must be used inside <LocaleProvider>.");
  }
  return value;
}

export const localeInitScript = `(function(){try{var m=document.cookie.match(/bts-locale=(en|id)/);var t=m?m[1]:localStorage.getItem("${STORAGE_KEY}");if(t==="id"||t==="en"){document.documentElement.lang=t;}}catch(e){}})();`;
