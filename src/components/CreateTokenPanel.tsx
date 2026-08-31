"use client";

import { useState } from "react";
import { encodeFunctionData } from "viem";
import { useAccount, useWriteContract } from "wagmi";
import { TOKEN_FACTORY_ADDRESS, factoryAbi, parseSupply } from "@/lib/factory";
import { targetChain, explorerAddressUrl } from "@/lib/chain";
import { groupDigits } from "@/lib/format";
import { useTxLifecycle } from "@/hooks/useTxLifecycle";
import { useGasEstimate } from "@/hooks/useGasEstimate";
import { Button, Spinner } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { TxState } from "@/components/TxState";

const MAX_SYMBOL_LENGTH = 11;

// Field has no maxLength prop; the shared symbol validation is the gate.

export function CreateTokenPanel({ onConfirmed }: { onConfirmed: () => void }) {
  const { address, isConnected, chainId } = useAccount();
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [supply, setSupply] = useState("");
  const [created, setCreated] = useState<string | undefined>(undefined);
  const { mutateAsync: writeContract } = useWriteContract();
  const tx = useTxLifecycle("Create token");

  const deployed = TOKEN_FACTORY_ADDRESS !== undefined;
  const onRightChain = chainId === targetChain.id;

  const trimmedName = name.trim();
  const trimmedSymbol = symbol.trim().toUpperCase();
  const symbolError =
    symbol.trim() === ""
      ? undefined
      : trimmedSymbol.length > MAX_SYMBOL_LENGTH
        ? `At most ${MAX_SYMBOL_LENGTH} characters.`
        : /[^A-Z0-9]/.test(trimmedSymbol)
          ? "Letters and digits only."
          : undefined;

  const parsed = parseSupply(supply);
  const supplyError = supply.trim() === "" ? undefined : !parsed.ok ? parsed.reason : undefined;
  // "676767" mints 676,767 * 10^18 base units — show the explorer-sized number
  // so the 18-decimal scaling is never a surprise.
  const supplyDigits = supply.trim().replace(/[^0-9]/g, "");
  const supplyPreview =
    supplyDigits === "" || !parsed.ok
      ? undefined
      : `${groupDigits(supplyDigits)} followed by 18 zeros on-chain`;

  const busy = tx.phase === "signing" || tx.phase === "pending";
  const canSubmit =
    isConnected &&
    onRightChain &&
    deployed &&
    trimmedSymbol.length > 0 &&
    symbolError === undefined &&
    parsed.ok &&
    !busy;

  const gasEstimate = useGasEstimate(
    parsed.ok && trimmedSymbol.length > 0 && symbolError === undefined && deployed
      ? {
          to: TOKEN_FACTORY_ADDRESS!,
          data: encodeFunctionData({
            abi: factoryAbi,
            functionName: "createToken",
            args: [trimmedName, trimmedSymbol, parsed.value],
          }),
        }
      : undefined,
    isConnected && !busy,
  );

  async function submit() {
    if (!parsed.ok || !address) return;
    const confirmed = await tx.run(() =>
      writeContract({
        address: TOKEN_FACTORY_ADDRESS!,
        abi: factoryAbi,
        functionName: "createToken",
        args: [trimmedName, trimmedSymbol, parsed.value],
      }),
    );

    if (confirmed) {
      setCreated(trimmedSymbol);
      setName("");
      setSymbol("");
      setSupply("");
      onConfirmed();
    }
  }

  if (!deployed) {
    return (
      <Card
        title="Create a token"
        description="Deploy your own fixed-supply ERC-20 through the studio's TokenFactory."
      >
        <p className="text-sm text-ink-muted">
          The factory contract is not deployed yet. Set{" "}
          <code className="font-mono text-xs">NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS</code>{" "}
          after running the Foundry deploy script in{" "}
          <code className="font-mono text-xs">contracts/</code>.
        </p>
      </Card>
    );
  }

  return (
    <Card
      title="Create a token"
      description="Deploys a fixed-supply ERC-20; the entire supply is minted to you."
    >
      <div className="space-y-4">
        <Field
          id="token-name"
          label="Name"
          value={name}
          onChange={setName}
          placeholder="Studio Token"
          disabled={!isConnected || busy}
        />

        <Field
          id="token-symbol"
          label="Symbol"
          value={symbol}
          onChange={(next) => setSymbol(next.toUpperCase())}
          placeholder="STUDIO"
          mono
          disabled={!isConnected || busy}
          error={symbolError}
          hint={isConnected ? undefined : "Connect a wallet to deploy"}
        />

        <Field
          id="token-supply"
          label="Total supply (whole tokens)"
          value={supply}
          onChange={setSupply}
          placeholder="1000000"
          inputMode="decimal"
          mono
          disabled={!isConnected || busy}
          error={supplyError}
          hint={supplyPreview}
        />
      </div>

      <Button
        className="mt-4 w-full"
        disabled={!canSubmit}
        onClick={() => void submit()}
      >
        {busy ? <Spinner label="Transaction in progress" /> : null}
        {isConnected ? "Deploy token" : "Connect a wallet to deploy"}
      </Button>

      {gasEstimate ? (
        <p className="mt-2 text-center text-xs text-ink-muted">{gasEstimate}</p>
      ) : null}

      <TxState tx={tx} />

      {created && tx.phase === "success" ? (
        <p className="mt-3 text-xs text-ink-muted">
          {created} is live — the supply is in your wallet. Check{" "}
          <a
            href={explorerAddressUrl(address ?? "")}
            target="_blank"
            rel="noreferrer"
            className="text-accent hover:underline"
          >
            your address
          </a>{" "}
          on the explorer.
        </p>
      ) : null}
    </Card>
  );
}
