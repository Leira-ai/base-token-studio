"use client";

import { explorerTxUrl } from "@/lib/chain";
import { truncateHex } from "@/lib/format";
import type { TxLifecycle } from "@/hooks/useTxLifecycle";
import { Spinner } from "@/components/ui/Button";

export function TxState({ tx }: { tx: TxLifecycle }) {
  if (tx.phase === "idle") return null;

  const hashLink = tx.hash ? (
    <a
      href={explorerTxUrl(tx.hash)}
      target="_blank"
      rel="noreferrer noopener"
      className="font-mono underline decoration-dotted underline-offset-2 hover:text-ink"
    >
      {truncateHex(tx.hash)}
    </a>
  ) : null;

  return (
    <div
      aria-live="polite"
      className="mt-3 flex items-center gap-2 text-xs text-ink-muted"
    >
      {tx.phase === "signing" ? (
        <>
          <Spinner label="Waiting for wallet" />
          <span>Confirm the request in your wallet.</span>
        </>
      ) : null}

      {tx.phase === "pending" ? (
        <>
          <Spinner label="Waiting for confirmation" />
          <span>Submitted, waiting for confirmation. {hashLink}</span>
        </>
      ) : null}

      {tx.phase === "success" ? (
        <>
          <span aria-hidden className="text-positive">
            ✓
          </span>
          <span className="text-positive">Confirmed.</span>
          {hashLink}
        </>
      ) : null}

      {tx.phase === "error" && tx.error ? (
        <>
          <span
            aria-hidden
            className={tx.error.isRejection ? "text-caution" : "text-negative"}
          >
            {tx.error.isRejection ? "!" : "×"}
          </span>
          <span className={tx.error.isRejection ? "text-caution" : "text-negative"}>
            {tx.error.message}
          </span>
          <button
            type="button"
            onClick={tx.reset}
            className="underline decoration-dotted underline-offset-2 hover:text-ink"
          >
            Dismiss
          </button>
        </>
      ) : null}
    </div>
  );
}
