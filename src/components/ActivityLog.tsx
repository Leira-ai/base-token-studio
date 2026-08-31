"use client";

import { explorerTxUrl } from "@/lib/chain";
import { truncateHex } from "@/lib/format";
import { useActivity, type ActivityStatus } from "@/lib/activity";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const statusStyle: Record<ActivityStatus, string> = {
  pending: "text-caution",
  success: "text-positive",
  error: "text-negative",
};

const statusLabel: Record<ActivityStatus, string> = {
  pending: "Pending",
  success: "Confirmed",
  error: "Failed",
};

export function ActivityLog() {
  const { entries, clear } = useActivity();

  return (
    <Card
      title="This session"
      description="Transactions you have sent since the page loaded."
      action={
        entries.length > 0 ? (
          <Button variant="ghost" onClick={clear}>
            Clear
          </Button>
        ) : undefined
      }
    >
      {entries.length === 0 ? (
        <p className="text-xs text-ink-muted">Nothing yet.</p>
      ) : (
        <ol className="space-y-2">
          {entries.map((entry) => (
            <li
              key={entry.hash}
              className="flex items-center justify-between gap-3 text-xs"
            >
              <span className="truncate">{entry.label}</span>
              <span className="flex shrink-0 items-center gap-2">
                <span className={statusStyle[entry.status]}>
                  {statusLabel[entry.status]}
                </span>
                <a
                  href={explorerTxUrl(entry.hash)}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-mono text-ink-muted underline decoration-dotted underline-offset-2 hover:text-ink"
                >
                  {truncateHex(entry.hash, 6, 4)}
                </a>
              </span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
