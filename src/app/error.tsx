"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Console only — no paid monitoring on the free tier.
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-4 text-center">
      <p className="font-mono text-6xl font-semibold text-negative/50">⚠</p>
      <h1 className="mt-4 text-xl font-semibold tracking-tight">
        Something reverted
      </h1>
      <p className="mt-2 max-w-md text-sm text-ink-muted">
        An unexpected error occurred. Your wallet and funds are unaffected —
        nothing was signed.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink transition-colors hover:bg-accent/85"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-border-subtle bg-surface-raised px-4 py-2.5 text-sm font-medium transition-colors hover:border-accent/60"
        >
          Back to the studio
        </Link>
      </div>
    </main>
  );
}
