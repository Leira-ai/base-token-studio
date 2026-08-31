"use client";

import { useAccount, useReadContracts } from "wagmi";
import { erc20Abi, formatUnits } from "viem";
import { TOKEN_FACTORY_ADDRESS, factoryAbi } from "@/lib/factory";
import { explorerAddressUrl } from "@/lib/chain";
import { Card } from "@/components/ui/Card";

type TokenRow = {
  address: string;
  name?: string;
  symbol?: string;
  supply?: bigint;
  decimals?: number;
};

/**
 * The factory records every token a creator deploys (tokensOf), so the list
 * needs no indexer or subgraph — one multicall fetches the addresses, then one
 * parallel multicall reads each token's ERC-20 metadata.
 */
export function MyTokens() {
  const { address, isConnected, chainId } = useAccount();

  const factory = useReadContracts({
    allowFailure: false,
    query: { enabled: isConnected && Boolean(address), refetchInterval: 15_000 },
    contracts: [
      {
        address: TOKEN_FACTORY_ADDRESS!,
        abi: factoryAbi,
        functionName: "tokensOf",
        args: address ? [address] : undefined,
      },
    ] as const,
  });

  const addresses = (factory.data?.[0] ?? []) as readonly string[];
  const tokens = addresses as readonly `0x${string}`[];

  const meta = useReadContracts({
    allowFailure: true,
    query: { enabled: tokens.length > 0, refetchInterval: 15_000 },
    contracts: tokens.flatMap(
      (token) =>
        [
          { address: token, abi: erc20Abi, functionName: "name" },
          { address: token, abi: erc20Abi, functionName: "symbol" },
          { address: token, abi: erc20Abi, functionName: "totalSupply" },
          { address: token, abi: erc20Abi, functionName: "decimals" },
        ] as const,
    ),
  });

  const rows: TokenRow[] = tokens.map((token, index) => {
    const results = meta.data?.slice(index * 4, index * 4 + 4) ?? [];
    const [name, symbol, supply, decimals] = results;
    return {
      address: token,
      name: name?.status === "success" ? (name.result as string) : undefined,
      symbol:
        symbol?.status === "success" ? (symbol.result as string) : undefined,
      supply:
        supply?.status === "success" ? (supply.result as bigint) : undefined,
      decimals:
        decimals?.status === "success" ? (decimals.result as number) : undefined,
    };
  });

  if (!isConnected) {
    return (
      <Card
        title="Your tokens"
        description="Tokens you have deployed through this factory."
      >
        <p className="text-sm text-ink-muted">
          Connect a wallet to see the tokens you have created.
        </p>
      </Card>
    );
  }

  if (factory.isLoading) {
    return (
      <Card
        title="Your tokens"
        description="Tokens you have deployed through this factory."
      >
        <p className="text-sm text-ink-muted">Loading…</p>
      </Card>
    );
  }

  return (
    <Card
      title="Your tokens"
      description="Tokens you have deployed through this factory."
    >
      {rows.length === 0 ? (
        <p className="text-sm text-ink-muted">
          None yet — deploy your first token above. It appears here
          automatically, read straight from the factory on-chain.
        </p>
      ) : (
        <ol className="space-y-2">
          {rows.map((row) => (
            <li
              key={row.address}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle py-2.5 last:border-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {row.name ?? "Unknown"}{" "}
                  <span className="text-ink-muted">· {row.symbol ?? "?"}</span>
                </p>
                <a
                  href={explorerAddressUrl(row.address)}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-mono text-xs text-ink-muted underline decoration-dotted underline-offset-2 hover:text-ink"
                >
                  {row.address}
                </a>
              </div>
              <p className="font-mono text-sm tabular-nums">
                {row.supply !== undefined && row.decimals !== undefined
                  ? new Intl.NumberFormat("en-US", {
                      maximumFractionDigits: 2,
                    }).format(Number(formatUnits(row.supply, row.decimals)))
                  : "—"}
              </p>
            </li>
          ))}
        </ol>
      )}
      {factory.error ? (
        <p className="mt-2 text-xs text-negative">
          Could not read the factory: {(factory.error as Error).message}
        </p>
      ) : null}
      {chainId ? null : null}
    </Card>
  );
}
