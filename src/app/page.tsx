"use client";

import { useAccount } from "wagmi";
import { targetChain } from "@/lib/chain";
import { useBalances } from "@/hooks/useBalances";
import { useLocale } from "@/lib/useLocale";
import { t } from "@/lib/i18n";
import { ActivityLog } from "@/components/ActivityLog";
import { BalancePanel } from "@/components/BalancePanel";
import { ConnectBar } from "@/components/ConnectBar";
import { CreateTokenPanel } from "@/components/CreateTokenPanel";
import { LocaleToggle } from "@/components/LocaleToggle";
import { MyTokens } from "@/components/MyTokens";
import { NetworkGuard } from "@/components/NetworkGuard";
import { TransferPanel } from "@/components/TransferPanel";
import { WrapPanel } from "@/components/WrapPanel";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TrustPanel } from "@/components/TrustPanel";
import { ToastStack } from "@/lib/toasts";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

/**
 * Panels render even before a wallet connects — actions disable themselves and
 * the connect control lives in the navbar. Every card shows a hint line about
 * what connecting unlocks, so the landing view explains the app instead of
 * gating it behind a single empty state.
 */
export default function Home() {
  const { isConnected } = useAccount();
  const { eth, weth, refetch, updatedAt, isStale } = useBalances();
  const { locale } = useLocale();

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      {/* relative z-10 keeps the wallet dropdown above the cards below: the
          header's rise-in animation leaves a persistent stacking context, so a
          plain z-index on the dropdown alone loses to later siblings. */}
      <header className="rise-in relative z-10 mb-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
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
              {t(locale, "tagline", { chain: targetChain.name })}
            </p>
          </div>
        </div>
        {/* Anchored top-right on desktop (items-start + no wrap of its own);
            the row keeps a fixed height so toggling EN/ID never reflows it. */}
        <div className="flex items-center gap-2 sm:h-10">
          <LocaleToggle />
          <ThemeToggle />
          <ConnectBar />
        </div>
      </header>

      <div className="space-y-4">
        <NetworkGuard />

        {isStale ? (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-caution/40 bg-caution/10 p-4"
          >
            <p className="text-sm">{t(locale, "staleBanner")}</p>
            <Button variant="secondary" onClick={refetch}>
              {t(locale, "retryNow")}
            </Button>
          </div>
        ) : null}

        <CreateTokenPanel onConfirmed={refetch} />

        {isConnected ? (
          <>
            <BalancePanel
              eth={eth}
              weth={weth}
              onRefresh={refetch}
              updatedAt={updatedAt}
              locale={locale}
            />
            <MyTokens locale={locale} />
            <div className="grid gap-4 md:grid-cols-2">
              <WrapPanel eth={eth} weth={weth} onConfirmed={refetch} />
              <TransferPanel weth={weth} onConfirmed={refetch} />
            </div>
            <ActivityLog />
            <TrustPanel />
          </>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <CardShell title={t(locale, "balances")} hint={t(locale, "balancesHint")} />
            <CardShell title={t(locale, "wrapSend")} hint={t(locale, "wrapHint")} />
          </div>
        )}
      </div>

      <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-muted">
        <span>{t(locale, "footer")}</span>
        <Link
          href="/learn"
          className="text-accent underline decoration-dotted underline-offset-2"
        >
          {t(locale, "learnCta")}
        </Link>
      </footer>

      <ToastStack />
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
