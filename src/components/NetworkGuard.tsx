"use client";

import { useAccount, useSwitchChain } from "wagmi";
import { targetChain } from "@/lib/chain";
import { toFriendlyError } from "@/lib/errors";
import { Button, Spinner } from "@/components/ui/Button";

/**
 * A wallet on the wrong chain will happily sign a transaction that then fails
 * against the wrong contracts, so the actions stay disabled until it switches.
 */
export function NetworkGuard() {
  const { isConnected, chainId } = useAccount();
  const switchChain = useSwitchChain();

  if (!isConnected || chainId === targetChain.id) return null;

  const error = toFriendlyError(switchChain.error);

  return (
    <div
      role="alert"
      className="rounded-xl border border-caution/40 bg-caution/10 p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">
          Your wallet is on another network. Switch to{" "}
          <strong className="font-semibold">{targetChain.name}</strong> to
          continue.
        </p>
        <Button
          disabled={switchChain.isPending}
          onClick={() => switchChain.mutate({ chainId: targetChain.id })}
        >
          {switchChain.isPending ? <Spinner label="Switching network" /> : null}
          Switch network
        </Button>
      </div>
      {error ? (
        <p
          className={`mt-2 text-xs ${error.isRejection ? "text-caution" : "text-negative"}`}
        >
          {error.message}
        </p>
      ) : null}
    </div>
  );
}
