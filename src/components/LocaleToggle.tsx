"use client";

import { LOCALE_LABELS, LOCALES, useLocale, type Locale } from "@/lib/useLocale";
import { Button } from "@/components/ui/Button";

export function LocaleToggle() {
  const { locale, setLocale } = useLocale();

  return (
    <div
      role="group"
      aria-label="Language"
      className="flex rounded-lg border border-border-subtle p-0.5"
    >
      {LOCALES.map((value: Locale) => (
        <Button
          key={value}
          variant={locale === value ? "primary" : "ghost"}
          aria-pressed={locale === value}
          onClick={() => setLocale(value)}
          className="px-2.5 py-1.5 text-xs"
        >
          {LOCALE_LABELS[value]}
        </Button>
      ))}
    </div>
  );
}
