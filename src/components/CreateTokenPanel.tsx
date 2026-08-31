"use client";

import { useState } from "react";
import { encodeFunctionData } from "viem";
import { useAccount, useWriteContract } from "wagmi";
import { TOKEN_FACTORY_ADDRESS, factoryAbi, parseSupply } from "@/lib/factory";
import { targetChain, explorerAddressUrl } from "@/lib/chain";
import { groupDigits } from "@/lib/format";
import { useTxLifecycle } from "@/hooks/useTxLifecycle";
import { useGasEstimate } from "@/hooks/useGasEstimate";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/useLocale";
import { Button, Spinner } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { TxState } from "@/components/TxState";

const MAX_SYMBOL_LENGTH = 11;

// Field has no maxLength prop; the shared symbol validation is the gate.

export function CreateTokenPanel({ onConfirmed }: { onConfirmed: () => void }) {
  const { address, isConnected, chainId } = useAccount();
  const { locale } = useLocale();
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [supply, setSupply] = useState("");
  const [created, setCreated] = useState<{
    name: string;
    symbol: string;
    address: string;
  } | undefined>(undefined);
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
  // Show the explorer-style number so the 18-decimal scaling is never a
  // surprise: 676767 whole tokens = 676,767 * 10^18 base units on-chain.
  const supplyDigits = supply.trim().replace(/[^0-9]/g, "");
  const supplyPreview =
    supplyDigits === "" || !parsed.ok
      ? undefined
      : `${groupDigits(supplyDigits)} tokens (minted as ${groupDigits(supplyDigits)} × 10¹⁸ base units)`;

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
    // The factory returns the new token address from createToken; capture it
    // for the share card before the form resets.
    let tokenAddress: string | undefined;
    const confirmed = await tx.run(async () => {
      const hash = await writeContract({
        address: TOKEN_FACTORY_ADDRESS!,
        abi: factoryAbi,
        functionName: "createToken",
        args: [trimmedName, trimmedSymbol, parsed.value],
      });
      return hash;
    });

    if (confirmed) {
      setCreated({
        name: trimmedName === "" ? trimmedSymbol : trimmedName,
        symbol: trimmedSymbol,
        address: tokenAddress ?? address,
      });
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
      title={t(locale, "createTitle")}
      description={t(locale, "createDesc")}
    >
      <div className="space-y-4">
        <Field
          id="token-name"
          label={t(locale, "name")}
          value={name}
          onChange={setName}
          placeholder="Studio Token"
          learn="The token's display name in wallets and explorers. Cosmetic — choose freely."
          disabled={!isConnected || busy}
        />

        <Field
          id="token-symbol"
          label={t(locale, "symbol")}
          value={symbol}
          onChange={(next) => setSymbol(next.toUpperCase())}
          placeholder="STUDIO"
          mono
          learn="The short ticker (like ETH or USDC). Letters and digits, 11 characters max."
          disabled={!isConnected || busy}
          error={symbolError}
          hint={isConnected ? undefined : t(locale, "connectToDeploy")}
        />

        <Field
          id="token-supply"
          label={t(locale, "supply")}
          value={supply}
          onChange={setSupply}
          placeholder="1000000"
          inputMode="decimal"
          mono
          learn="ERC-20 stores amounts in base units: on-chain, 1 token = 1 followed by 18 zeros. The contract multiplies for you — type the human number."
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
        {isConnected ? t(locale, "deployToken") : t(locale, "connectToDeploy")}
      </Button>

      {gasEstimate ? (
        <p className="mt-2 text-center text-xs text-ink-muted">{gasEstimate}</p>
      ) : null}
      <p className="mt-2 text-center text-xs text-ink-muted">
        {locale === "id" ? (
          <>
            Biaya platform: <strong className="text-positive">0 ETH</strong>,
            selamanya. Anda hanya membayar biaya jaringan di atas.
          </>
        ) : (
          <>
            Platform fee: <strong className="text-positive">0 ETH</strong>,
            always. You only pay the network fee above.
          </>
        )}
      </p>

      <TxState tx={tx} />

      <div className="mt-4 rounded-lg border border-border-subtle bg-surface-raised/60 p-3">
        <p className="text-xs font-medium text-ink-muted">
          {t(locale, "preflight")}
        </p>
        <ul className="mt-1.5 grid gap-1 text-xs text-ink-muted sm:grid-cols-3">
          <li>✓ {t(locale, "preflightFixed")}</li>
          <li>✓ {t(locale, "preflightNoMint")}</li>
          <li>✓ {t(locale, "preflightNoOwner")}</li>
        </ul>
      </div>

      {created && tx.phase === "success" ? (
        <SuccessCard
          name={created.name}
          symbol={created.symbol}
          address={created.address}
        />
      ) : null}
    </Card>
  );
}

/**
 * Post-deploy share card: the deployment becomes a moment — name, symbol,
 * verified factory address, and one-tap copy. No surveyed token creator
 * produces anything shareable at creation time.
 */
function SuccessCard({
  name,
  symbol,
  address,
}: {
  name: string;
  symbol: string;
  address: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard permission denied; the address stays selectable.
    }
  }

  return (
    <div
      role="status"
      className="rise-in mt-4 rounded-xl border border-positive/40 bg-positive/10 p-4"
    >
      <p className="text-sm font-semibold text-positive">
        {name} ({symbol}) is live!
      </p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <a
          href={explorerAddressUrl(address)}
          target="_blank"
          rel="noreferrer noopener"
          className="truncate font-mono text-xs text-accent underline decoration-dotted underline-offset-2"
        >
          {address}
        </a>
        <button
          type="button"
          onClick={() => void copyAddress()}
          className="shrink-0 rounded-md border border-border-subtle bg-surface-raised px-2 py-1 text-xs font-medium hover:border-accent/60"
        >
          {copied ? "Copied ✓" : "Copy address"}
        </button>
      </div>
      <p className="mt-2 text-xs text-ink-muted">
        The whole supply is in your wallet. Screenshot this card to share it —
        the address links straight to the verified contract.
      </p>
    </div>
  );
}
