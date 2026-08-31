"use client";

import { useAccount } from "wagmi";
import { targetChain } from "@/lib/chain";
import { useBalances } from "@/hooks/useBalances";
import { ActivityLog } from "@/components/ActivityLog";
import { BalancePanel } from "@/components/BalancePanel";
import { ConnectBar } from "@/components/ConnectBar";
import { CreateTokenPanel } from "@/components/CreateTokenPanel";
import { NetworkGuard } from "@/components/NetworkGuard";
import { TransferPanel } from "@/components/TransferPanel";
import { WrapPanel } from "@/components/WrapPanel";

/**
 * Panels render even before a wallet connects — actions disable themselves and
 * the connect control lives in the navbar. Every card shows a hint line about
 * what connecting unlocks, so the landing view explains the app instead of
 * gating it behind a single empty state.
 */
export default function Home() {
  const { isConnected } = useAccount();
  const { eth, weth, refetch } = useBalances();

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      {/* relative z-10 keeps the wallet dropdown above the cards below: the
          header's rise-in animation leaves a persistent stacking context, so a
          plain z-index on the dropdown alone loses to later siblings. */}
      <header className="rise-in relative z-10 mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- tiny inline logo, no optimization pipeline needed */}
          <img
            src="/logo.svg"
            alt=""
            width={40}
            height={40}
            className="mt-0.5 drop-shadow-[0_0_14px_rgba(79,124,255,0.45)]"
          />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Base Token Studio
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              Create tokens, wrap ETH, and send ERC-20 transfers on{" "}
              {targetChain.name}.
            </p>
          </div>
        </div>
        <ConnectBar />
      </header>

      <div className="space-y-4">
        <NetworkGuard />

        <CreateTokenPanel onConfirmed={refetch} />

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
          <div className="grid gap-4 md:grid-cols-2">
            <CardShell
              title="Balances"
              hint="Connect a wallet to read your ETH and WETH balances."
            />
            <CardShell
              title="Wrap and send"
              hint="Connect a wallet to wrap ETH ↔ WETH and send ERC-20 transfers."
            />
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

function CardShell({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="rise-in rise-in-2 rounded-xl border border-border-subtle bg-surface p-6 transition-colors hover:border-border-hover">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-2 text-xs text-ink-muted">{hint}</p>
    </div>
  );
}
