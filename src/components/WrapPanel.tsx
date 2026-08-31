"use client";

import { useState } from "react";
import { parseEther } from "viem";
import { useAccount, useWriteContract } from "wagmi";
import { WETH_ADDRESS, weth9Abi } from "@/lib/contracts";
import { targetChain } from "@/lib/chain";
import { formatBalance, parseAmount } from "@/lib/format";
import { useTxLifecycle } from "@/hooks/useTxLifecycle";
import { Button, Spinner } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { TxState } from "@/components/TxState";

type Mode = "wrap" | "unwrap";

type Token = {
  value: bigint | undefined;
  symbol: string;
  decimals: number;
};

/**
 * Wrapping the entire ETH balance would leave nothing to pay for the wrap
 * itself, so "Max" keeps a small headroom instead of estimating gas twice.
 */
const GAS_HEADROOM = parseEther("0.0003");

export function WrapPanel({
  eth,
  weth,
  onConfirmed,
}: {
  eth: Token;
  weth: Token;
  onConfirmed: () => void;
}) {
  const { isConnected, chainId } = useAccount();
  const [mode, setMode] = useState<Mode>("wrap");
  const [amount, setAmount] = useState("");
  const { mutateAsync: writeContract } = useWriteContract();
  const tx = useTxLifecycle(mode === "wrap" ? "Wrap ETH" : "Unwrap WETH");

  const onRightChain = chainId === targetChain.id;
  const source = mode === "wrap" ? eth : weth;
  const parsed = parseAmount(amount, source.decimals);
  const overBalance =
    parsed.ok && source.value !== undefined && parsed.value > source.value;

  const touched = amount.trim() !== "";
  const fieldError = !touched
    ? undefined
    : !parsed.ok
      ? parsed.reason
      : overBalance
        ? `You only have ${formatBalance(source.value, source.decimals)} ${source.symbol}.`
        : undefined;

  const busy = tx.phase === "signing" || tx.phase === "pending";
  const canSubmit =
    isConnected && onRightChain && parsed.ok && !overBalance && !busy;

  function switchMode(next: Mode) {
    setMode(next);
    setAmount("");
    tx.reset();
  }

  async function submit() {
    if (!parsed.ok) return;

    // Kept as separate calls rather than a ternary so wagmi can narrow each
    // request against the ABI: `deposit` is payable, `withdraw` is not.
    let confirmed: boolean;
    if (mode === "wrap") {
      confirmed = await tx.run(() =>
        writeContract({
          address: WETH_ADDRESS,
          abi: weth9Abi,
          functionName: "deposit",
          value: parsed.value,
        }),
      );
    } else {
      confirmed = await tx.run(() =>
        writeContract({
          address: WETH_ADDRESS,
          abi: weth9Abi,
          functionName: "withdraw",
          args: [parsed.value],
        }),
      );
    }

    if (confirmed) {
      setAmount("");
      onConfirmed();
    }
  }

  function setMax() {
    if (source.value === undefined) return;
    const max =
      mode === "wrap"
        ? source.value > GAS_HEADROOM
          ? source.value - GAS_HEADROOM
          : 0n
        : source.value;
    setAmount(formatBalance(max, source.decimals, source.decimals));
  }

  return (
    <Card
      title="Wrap and unwrap"
      description="ETH ↔ WETH through the canonical WETH9 predeploy."
      action={
        <div
          role="tablist"
          aria-label="Direction"
          className="flex rounded-lg border border-border-subtle p-0.5"
        >
          {(["wrap", "unwrap"] as const).map((value) => (
            <button
              key={value}
              role="tab"
              type="button"
              aria-selected={mode === value}
              onClick={() => switchMode(value)}
              className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${
                mode === value
                  ? "bg-surface-raised text-ink"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      }
    >
      <Field
        id="wrap-amount"
        label={mode === "wrap" ? "ETH to wrap" : "WETH to unwrap"}
        value={amount}
        onChange={setAmount}
        placeholder="0.0"
        inputMode="decimal"
        mono
        disabled={!isConnected || busy}
        error={fieldError}
        hint={`Balance ${formatBalance(source.value, source.decimals)} ${source.symbol}`}
        trailing={
          <button
            type="button"
            onClick={setMax}
            disabled={!isConnected || busy || source.value === undefined}
            className="shrink-0 text-xs font-medium text-accent hover:underline disabled:opacity-45"
          >
            Max
          </button>
        }
      />

      <Button
        className="mt-4 w-full"
        disabled={!canSubmit}
        onClick={() => void submit()}
      >
        {busy ? <Spinner label="Transaction in progress" /> : null}
        {mode === "wrap" ? "Wrap ETH" : "Unwrap WETH"}
      </Button>

      <TxState tx={tx} />
    </Card>
  );
}
