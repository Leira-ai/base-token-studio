import { baseSepolia } from "viem/chains";

/**
 * Single source of truth for the network this app targets. Every chain-aware
 * component reads from here so adding a second network stays a one-file change.
 */
export const targetChain = baseSepolia;

/** Public RPC is rate limited; a dedicated endpoint is used when provided. */
export const rpcUrl =
  process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL ?? "https://sepolia.base.org";

export function explorerTxUrl(hash: string): string {
  return `${targetChain.blockExplorers.default.url}/tx/${hash}`;
}

export function explorerAddressUrl(address: string): string {
  return `${targetChain.blockExplorers.default.url}/address/${address}`;
}
