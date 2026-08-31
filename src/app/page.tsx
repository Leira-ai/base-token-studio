"use client";

import { useAccount } from "wagmi";
import { targetChain } from "@/lib/chain";
import { useBalances } from "@/hooks/useBalances";
import { ActivityLog } from "@/components/ActivityLog";
import { BalancePanel } from "@/components/BalancePanel";
import { ConnectBar } from "@/components/ConnectBar";
import { NetworkGuard } from "@/components/NetworkGuard";
import { TransferPanel } from "@/components/TransferPanel";
import { WrapPanel } from "@/components/WrapPanel";

export default function Home() {
  const { isConnected } = useAccount();
  const { eth, weth, refetch } = useBalances();

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Base Token Studio
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Balances, WETH wrapping, and ERC-20 transfers on{" "}
            {targetChain.name}.
          </p>
        </div>
        <ConnectBar />
      </header>

      <div className="space-y-4">
        <NetworkGuard />

        {isConnected ? (
          <>
            <BalancePanel eth={eth} weth={weth} onRefresh={refetch} />
            <div className="grid gap-4 md:grid-cols-2">
              <WrapPanel eth={eth} weth={weth} onConfirmed={refetch} />
              <TransferPanel weth={weth} onConfirmed={refetch} />
            </div>
            <ActivityLog />
          </>
        ) : (
          <div className="rounded-xl border border-border-subtle bg-surface p-8 text-center">
            <p className="text-sm text-ink-muted">
              Connect a wallet to read balances and send transactions.
            </p>
            <p className="mt-2 text-xs text-ink-muted">
              This app only targets {targetChain.name}, so no real funds are at
              risk.
            </p>
          </div>
        )}
      </div>

      <footer className="mt-10 text-xs text-ink-muted">
        Testnet only. Every transaction is signed in your own wallet; this app
        never holds keys.
      </footer>
    </main>
  );
}
