"use client";

import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/useLocale";

/**
 * "Updated 12s ago" — surfaces the age of on-chain data instead of presenting
 * every number as timeless. Competitors show figures with no staleness cue;
 * when an RPC stalls, this is the difference between a wrong-looking zero and
 * an obviously stale one.
 */
export function UpdatedAgo({
  at,
  locale = "en",
  className = "",
}: {
  at: number;
  locale?: Locale;
  className?: string;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!at) return null;

  const seconds = Math.max(0, Math.floor((now - at) / 1000));
  const age =
    seconds < 5
      ? t(locale, "justNow")
      : seconds < 60
        ? t(locale, "secondsAgo", { n: String(seconds) })
        : t(locale, "minutesAgo", { n: String(Math.floor(seconds / 60)) });

  return (
    <span className={`tabular-nums ${className}`} title="Data age">
      {t(locale, "updated", { age })}
    </span>
  );
}
