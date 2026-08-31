"use client";

import { useState } from "react";
import { encodeFunctionData } from "viem";
import { useAccount, useConfig, useWriteContract } from "wagmi";
import { readContract } from "wagmi/actions";
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_IMAGE_URI_LENGTH,
  TOKEN_FACTORY_V2_ADDRESS,
  factoryV2Abi,
  parseSupply,
} from "@/lib/factory";
import { targetChain, explorerAddressUrl } from "@/lib/chain";
import { groupDigits } from "@/lib/format";
import { useTxLifecycle } from "@/hooks/useTxLifecycle";
import { useGasEstimate } from "@/hooks/useGasEstimate";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/useLocale";
import type { Locale } from "@/lib/useLocale";
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
  const [description, setDescription] = useState("");
  const [imageURI, setImageURI] = useState("");
  const [burnable, setBurnable] = useState(false);
  const [created, setCreated] = useState<{
    name: string;
    symbol: string;
    address: string;
  } | undefined>(undefined);
  const { mutateAsync: writeContract } = useWriteContract();
  const config = useConfig();
  const tx = useTxLifecycle("Create token");

  const deployed = true; // V2 factory address is a compile-time constant.
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

  const trimmedDescription = description.trim();
  const trimmedImageURI = imageURI.trim();
  const descriptionError =
    trimmedDescription.length > MAX_DESCRIPTION_LENGTH
      ? `At most ${MAX_DESCRIPTION_LENGTH} characters.`
      : undefined;
  const imageError =
    trimmedImageURI.length > MAX_IMAGE_URI_LENGTH
      ? `At most ${MAX_IMAGE_URI_LENGTH} characters.`
      : trimmedImageURI !== "" && !/^(https?|ipfs):\/\//.test(trimmedImageURI)
        ? "Use an https:// or ipfs:// URL."
        : undefined;

  const busy = tx.phase === "signing" || tx.phase === "pending";
  const canSubmit =
    isConnected &&
    onRightChain &&
    deployed &&
    trimmedSymbol.length > 0 &&
    symbolError === undefined &&
    descriptionError === undefined &&
    imageError === undefined &&
    parsed.ok &&
    !busy;

  const gasEstimate = useGasEstimate(
    parsed.ok &&
      trimmedSymbol.length > 0 &&
      symbolError === undefined &&
      descriptionError === undefined &&
      imageError === undefined
      ? {
          to: TOKEN_FACTORY_V2_ADDRESS,
          data: encodeFunctionData({
            abi: factoryV2Abi,
            functionName: "createToken",
            args: [
              trimmedName,
              trimmedSymbol,
              parsed.value,
              burnable,
              trimmedDescription,
              trimmedImageURI,
            ],
          }),
        }
      : undefined,
    isConnected && !busy,
  );

  async function submit() {
    if (!parsed.ok || !address) return;
    const confirmed = await tx.run(() =>
      writeContract({
        address: TOKEN_FACTORY_V2_ADDRESS,
        abi: factoryV2Abi,
        functionName: "createToken",
        args: [
          trimmedName,
          trimmedSymbol,
          parsed.value,
          burnable,
          trimmedDescription,
          trimmedImageURI,
        ],
      }),
    );

    if (confirmed) {
      // createToken's return value is not available from a write receipt, so
      // read the creator's token list and take the newest entry — the factory
      // appends in order.
      let tokenAddress = address;
      try {
        const tokens = await readContract(config, {
          address: TOKEN_FACTORY_V2_ADDRESS,
          abi: factoryV2Abi,
          functionName: "tokensOf",
          args: [address],
        });
        const newest = tokens[tokens.length - 1];
        if (newest) tokenAddress = newest;
      } catch {
        // Fall back to the creator address; the toast already links the tx.
      }

      setCreated({
        name: trimmedName === "" ? trimmedSymbol : trimmedName,
        symbol: trimmedSymbol,
        address: tokenAddress,
      });
      setName("");
      setSymbol("");
      setSupply("");
      setDescription("");
      setImageURI("");
      setBurnable(false);
      onConfirmed();
    }
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

        <Field
          id="token-description"
          label={locale === "id" ? "Deskripsi (opsional)" : "Description (optional)"}
          value={description}
          onChange={setDescription}
          placeholder={
            locale === "id"
              ? "Token komunitas untuk…"
              : "A community token for…"
          }
          learn="Stored on-chain in the factory and shown on your token's public page."
          disabled={!isConnected || busy}
          error={descriptionError}
          hint={`${trimmedDescription.length}/${MAX_DESCRIPTION_LENGTH}`}
        />

        <Field
          id="token-image"
          label={locale === "id" ? "URL logo (opsional)" : "Logo URL (optional)"}
          value={imageURI}
          onChange={setImageURI}
          placeholder="https://… or ipfs://…"
          mono
          learn="A link to your token's image. IPFS is recommended so the logo outlives any single host."
          disabled={!isConnected || busy}
          error={imageError}
        />

        <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border-subtle bg-surface-raised/60 p-3">
          <input
            type="checkbox"
            checked={burnable}
            onChange={(event) => setBurnable(event.target.checked)}
            disabled={!isConnected || busy}
            className="mt-0.5 size-4 accent-[var(--color-accent)]"
          />
          <span className="text-xs">
            <span className="font-medium">
              {locale === "id"
                ? "Izinkan holder membakar token miliknya"
                : "Let holders burn their own tokens"}
            </span>
            <span className="mt-0.5 block text-ink-muted">
              {locale === "id"
                ? "Holder bisa menghancurkan saldo miliknya sendiri secara permanen. Tidak ada yang bisa membakar token orang lain, dan supply tetap tidak bisa ditambah."
                : "Holders can permanently destroy their own balance. Nobody can burn anyone else's tokens, and supply still can never increase."}
            </span>
          </span>
        </label>
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
          locale={locale}
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
  locale,
}: {
  name: string;
  symbol: string;
  address: string;
  locale: Locale;
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

  const liveMessage =
    locale === "id" ? "sudah live!" : "is live!";

  return (
    <div
      role="status"
      className="rise-in mt-4 rounded-xl border border-positive/40 bg-positive/10 p-4"
    >
      <p className="text-sm font-semibold text-positive">
        {name} ({symbol}) {liveMessage}
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
      <div className="mt-3 border-t border-border-subtle pt-3">
        <p className="text-xs font-medium text-ink-muted">
          {locale === "id" ? "Langkah selanjutnya:" : "What's next:"}
        </p>
        <ol className="mt-1.5 space-y-1 text-xs text-ink-muted">
          <li>
            1.{" "}
            <a
              href={`https://sepolia.basescan.org/address/${address}#code`}
              target="_blank"
              rel="noreferrer noopener"
              className="text-accent underline decoration-dotted underline-offset-2"
            >
              {locale === "id" ? "Cek kontrak di Basescan" : "Check the contract on Basescan"}
            </a>{" "}
            —{" "}
            {locale === "id"
              ? "pastikan source-nya terbuka sebelum membagikan."
              : "confirm the source is open before you share it."}
          </li>
          <li>
            2.{" "}
            {locale === "id"
              ? "Ingin token diperdagangkan? Tambahkan pool di Uniswap (Base Sepolia) memakai alamat token di atas."
              : "Want it tradable? Create a Uniswap pool on Base Sepolia using the token address above."}
          </li>
          <li>
            3.{" "}
            {locale === "id"
              ? "Bagikan halaman token + alamat kontrak ke komunitas Anda."
              : "Share the token page + contract address with your community."}
          </li>
        </ol>
      </div>
      <p className="mt-2 text-xs text-ink-muted">
        {locale === "id"
          ? "Seluruh supply sudah ada di wallet Anda."
          : "The whole supply is in your wallet."}
      </p>
    </div>
  );
}
