"use client";

import { useEffect, useState } from "react";

/**
 * "Updated 12s ago" — surfaces the age of on-chain data instead of presenting
 * every number as timeless. Competitors show figures with no staleness cue;
 * when an RPC stalls, this is the difference between a wrong-looking zero and
 * an obviously stale one.
 */
export function UpdatedAgo({ at, className = "" }: { at: number; className?: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!at) return null;

  const seconds = Math.max(0, Math.floor((now - at) / 1000));
  const label =
    seconds < 5
      ? "just now"
      : seconds < 60
        ? `${seconds}s ago`
        : `${Math.floor(seconds / 60)}m ago`;

  return (
    <span className={`tabular-nums ${className}`} title="Data age">
      Updated {label}
    </span>
  );
}
