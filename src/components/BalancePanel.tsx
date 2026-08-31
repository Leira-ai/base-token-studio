"use client";

import type { ReactNode } from "react";
import { WETH_ADDRESS } from "@/lib/contracts";
import { explorerAddressUrl } from "@/lib/chain";
import { formatBalance, formatFull, truncateHex } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { UpdatedAgo } from "@/components/UpdatedAgo";

type Token = {
  value: bigint | undefined;
  symbol: string;
  decimals: number;
  isLoading: boolean;
  error: Error | null;
};

function Row({ token, note }: { token: Token; note?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border-subtle py-3 last:border-0">
      <div>
        <p className="text-sm font-medium">{token.symbol}</p>
        {note ? <p className="mt-0.5 text-xs text-ink-muted">{note}</p> : null}
      </div>
      <p
        className="font-mono text-sm tabular-nums"
        title={formatFull(token.value, token.decimals)}
      >
        {token.error ? (
          <span className="text-negative">unavailable</span>
        ) : token.isLoading ? (
          <span className="text-ink-muted">loading…</span>
        ) : (
          formatBalance(token.value, token.decimals)
        )}
      </p>
    </div>
  );
}

export function BalancePanel({
  eth,
  weth,
  onRefresh,
  updatedAt,
}: {
  eth: Token;
  weth: Token;
  onRefresh: () => void;
  updatedAt: number;
}) {
  const needsFunds = eth.value === 0n;

  return (
    <Card
      title="Balances"
      description={
        <>
          Read as a single multicall, so both figures come from the same block.{" "}
          <UpdatedAgo at={updatedAt} className="text-ink-muted/80" />
        </>
      }
      action={
        <Button variant="ghost" onClick={onRefresh}>
          Refresh
        </Button>
      }
    >
      <Row token={eth} note="Native gas token" />
      <Row
        token={weth}
        note={
          <a
            href={explorerAddressUrl(WETH_ADDRESS)}
            target="_blank"
            rel="noreferrer noopener"
            className="font-mono underline decoration-dotted underline-offset-2 hover:text-ink"
          >
            {truncateHex(WETH_ADDRESS)}
          </a>
        }
      />

      {needsFunds ? (
        <p className="mt-3 text-xs text-caution">
          This account has no test ETH.{" "}
          <a
            href="https://docs.base.org/chain/network-faucets"
            target="_blank"
            rel="noreferrer noopener"
            className="underline decoration-dotted underline-offset-2"
          >
            Get some from a Base Sepolia faucet
          </a>{" "}
          before sending a transaction.
        </p>
      ) : null}
    </Card>
  );
}
