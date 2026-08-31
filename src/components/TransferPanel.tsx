"use client";

import { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { WETH_ADDRESS, erc20Abi } from "@/lib/contracts";
import { targetChain } from "@/lib/chain";
import { formatBalance, parseAmount } from "@/lib/format";
import { validateRecipient } from "@/lib/recipient";
import { useTxLifecycle } from "@/hooks/useTxLifecycle";
import { Button, Spinner } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { TxState } from "@/components/TxState";

export function TransferPanel({
  weth,
  onConfirmed,
}: {
  weth: { value: bigint | undefined; symbol: string; decimals: number };
  onConfirmed: () => void;
}) {
  const { address, isConnected, chainId } = useAccount();
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const { mutateAsync: writeContract } = useWriteContract();
  const tx = useTxLifecycle(`Send ${weth.symbol}`);

  const recipient = validateRecipient(to, {
    token: WETH_ADDRESS,
    self: address,
  });
  const parsed = parseAmount(amount, weth.decimals);
  const overBalance =
    parsed.ok && weth.value !== undefined && parsed.value > weth.value;

  const toError = to.trim() === "" || recipient.ok ? undefined : recipient.reason;
  const amountError =
    amount.trim() === ""
      ? undefined
      : !parsed.ok
        ? parsed.reason
        : overBalance
          ? `You only have ${formatBalance(weth.value, weth.decimals)} ${weth.symbol}.`
          : undefined;

  const busy = tx.phase === "signing" || tx.phase === "pending";
  const canSubmit =
    isConnected &&
    chainId === targetChain.id &&
    recipient.ok &&
    parsed.ok &&
    !overBalance &&
    !busy;

  async function submit() {
    if (!recipient.ok || !parsed.ok) return;
    const confirmed = await tx.run(() =>
      writeContract({
        address: WETH_ADDRESS,
        abi: erc20Abi,
        functionName: "transfer",
        args: [recipient.address, parsed.value],
      }),
    );

    if (confirmed) {
      setTo("");
      setAmount("");
      onConfirmed();
    }
  }

  return (
    <Card
      title={`Send ${weth.symbol}`}
      description="A plain ERC-20 transfer, validated before it reaches your wallet."
    >
      <div className="space-y-4">
        <Field
          id="transfer-to"
          label="Recipient"
          value={to}
          onChange={setTo}
          placeholder="0x…"
          mono
          disabled={!isConnected || busy}
          error={toError}
        />

        <Field
          id="transfer-amount"
          label="Amount"
          value={amount}
          onChange={setAmount}
          placeholder="0.0"
          inputMode="decimal"
          mono
          disabled={!isConnected || busy}
          error={amountError}
          hint={`Balance ${formatBalance(weth.value, weth.decimals)} ${weth.symbol}`}
          trailing={
            <button
              type="button"
              onClick={() =>
                weth.value !== undefined &&
                setAmount(formatBalance(weth.value, weth.decimals, weth.decimals))
              }
              disabled={!isConnected || busy || weth.value === undefined}
              className="shrink-0 text-xs font-medium text-accent hover:underline disabled:opacity-45"
            >
              Max
            </button>
          }
        />
      </div>

      {recipient.ok && recipient.warning ? (
        <p className="mt-3 text-xs text-caution">{recipient.warning}</p>
      ) : null}

      <Button
        className="mt-4 w-full"
        disabled={!canSubmit}
        onClick={() => void submit()}
      >
        {busy ? <Spinner label="Transaction in progress" /> : null}
        Send
      </Button>

      <TxState tx={tx} />
    </Card>
  );
}
