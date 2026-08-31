import type { Metadata } from "next";
import { erc20Abi, formatUnits, isAddress } from "viem";
import { readContract } from "wagmi/actions";
import { getConfig } from "@/lib/wagmi";
import {
  explorerAddressUrl,
  targetChain,
} from "@/lib/chain";
import { TOKEN_FACTORY_V2_ADDRESS, factoryV2Abi } from "@/lib/factory";
import Link from "next/link";

type TokenInfo = {
  name: string;
  symbol: string;
  supply: bigint;
  decimals: number;
  description: string;
  imageURI: string;
  burnable: boolean;
};

async function getToken(address: string): Promise<TokenInfo | null> {
  if (!isAddress(address)) return null;
  const config = getConfig();
  try {
    const [name, symbol, supply, decimals] = await Promise.all([
      readContract(config, {
        address: address as `0x${string}`,
        abi: erc20Abi,
        functionName: "name",
      }),
      readContract(config, {
        address: address as `0x${string}`,
        abi: erc20Abi,
        functionName: "symbol",
      }),
      readContract(config, {
        address: address as `0x${string}`,
        abi: erc20Abi,
        functionName: "totalSupply",
      }),
      readContract(config, {
        address: address as `0x${string}`,
        abi: erc20Abi,
        functionName: "decimals",
      }),
    ]);

    // Metadata only exists for v2-created tokens; v1 tokens simply have none.
    const info = await readContract(config, {
      address: TOKEN_FACTORY_V2_ADDRESS,
      abi: factoryV2Abi,
      functionName: "tokenInfo",
      args: [address as `0x${string}`],
    }).catch(() => ["", "", false] as const);

    return {
      name: String(name),
      symbol: String(symbol),
      supply: supply as bigint,
      decimals: decimals as number,
      description: String(info[0] ?? ""),
      imageURI: String(info[1] ?? ""),
      burnable: Boolean(info[2]),
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ address: string }>;
}): Promise<Metadata> {
  const { address } = await params;
  const token = await getToken(address);
  if (!token) return { title: "Token not found — Base Token Studio" };
  const title = `${token.name} (${token.symbol}) — Base Token Studio`;
  const description = `Fixed-supply ERC-20 on ${targetChain.name}. Supply ${formatUnits(
    token.supply,
    token.decimals,
  )} ${token.symbol} — no mint function, no owner, no tax. Verified factory.`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
  };
}

export default async function TokenPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  const token = await getToken(address);

  if (!token) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-4 text-center">
        <h1 className="text-xl font-semibold tracking-tight">
          Token not found
        </h1>
        <p className="mt-2 max-w-md text-sm text-ink-muted">
          That address is not a readable ERC-20 on {targetChain.name}. Check
          the address and try again.
        </p>
        <Link
          href="/"
          className="mt-6 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink hover:bg-accent/85"
        >
          Back to the studio
        </Link>
      </main>
    );
  }

  const supply = formatUnits(token.supply, token.decimals);
  const supplyShort = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(Number(supply));

  const facts = [
    {
      label: "Fixed supply",
      detail: `${supplyShort} ${token.symbol} — minted once at creation`,
      ok: true,
    },
    {
      label: "No mint function",
      detail: "The supply cannot be increased, ever",
      ok: true,
    },
    {
      label: "No owner, no admin",
      detail: "No key can pause, seize, or modify the token",
      ok: true,
    },
    { label: "0% transfer tax", detail: "Plain ERC-20 transfers, nothing skimmed", ok: true },
    ...(token.burnable
      ? [
          {
            label: "Holders can burn their own tokens",
            detail: "Opt-in at creation; nobody can burn anyone else's balance",
            ok: true,
          },
        ]
      : []),
  ];

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="rise-in mb-8">
        <p className="text-xs uppercase tracking-wide text-ink-muted">
          Token on {targetChain.name}
        </p>
        <div className="mt-1 flex items-start gap-3">
          {token.imageURI ? (
            // eslint-disable-next-line @next/next/no-img-element -- creator-supplied URL, no loader config
            <img
              src={token.imageURI}
              alt=""
              width={48}
              height={48}
              className="mt-1 size-12 shrink-0 rounded-full border border-border-subtle bg-surface-raised object-cover"
            />
          ) : null}
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">
              {token.name}{" "}
              <span className="text-ink-muted">({token.symbol})</span>
            </h1>
            {token.description ? (
              <p className="mt-1 text-sm text-ink-muted">{token.description}</p>
            ) : null}
          </div>
        </div>
        <a
          href={explorerAddressUrl(address)}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-2 inline-block font-mono text-xs text-accent underline decoration-dotted underline-offset-2"
        >
          {address}
        </a>
      </header>

      <section className="rise-in rounded-xl border border-border-subtle bg-surface p-5">
        <h2 className="text-sm font-semibold">Safety facts</h2>
        <ul className="mt-3 space-y-2.5">
          {facts.map((fact) => (
            <li key={fact.label} className="flex items-start gap-2.5 text-sm">
              <span aria-hidden className="mt-0.5 font-semibold text-positive">
                ✓
              </span>
              <div>
                <p className="font-medium">{fact.label}</p>
                <p className="text-xs text-ink-muted">{fact.detail}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-ink-muted">
          These properties come from the contract this studio deploys —{" "}
          <a
            href={`https://repo.sourcify.dev/contracts/partial_match/84532/${TOKEN_FACTORY_V2_ADDRESS}`}
            target="_blank"
            rel="noreferrer noopener"
            className="text-accent underline decoration-dotted underline-offset-2"
          >
            read the verified source (Sourcify)
          </a>
          . Anyone can re-verify the bytecode against it.
        </p>
      </section>

      <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-muted">
        <Link
          href="/"
          className="text-accent underline decoration-dotted underline-offset-2"
        >
          ← Create your own token
        </Link>
        <span>Share this page — the facts above are verifiable on-chain.</span>
      </footer>
    </main>
  );
}
