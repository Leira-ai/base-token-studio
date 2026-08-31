import type { Address } from "viem";
import { parseAmount, type ParsedAmount } from "./format.ts";

/**
 * Set via NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS once the deploy script has run.
 * The Create Token panel stays disabled with an explanation until this exists,
 * so the app never points at a placeholder address.
 */
export const TOKEN_FACTORY_ADDRESS: Address | undefined = process.env
  .NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS as Address | undefined;

/**
 * Hand-written minimal ABI matching contracts/src/TokenFactory.sol. Kept in
 * sync manually because the frontend only needs these three entries plus the
 * event — regenerating from forge artifacts would pull in the whole build.
 */
export const factoryAbi = [
  {
    type: "function",
    name: "createToken",
    stateMutability: "nonpayable",
    inputs: [
      { name: "name", type: "string" },
      { name: "symbol", type: "string" },
      { name: "supply", type: "uint256" },
    ],
    outputs: [{ name: "token", type: "address" }],
  },
  {
    type: "function",
    name: "tokensOf",
    stateMutability: "view",
    inputs: [{ name: "creator", type: "address" }],
    outputs: [{ name: "", type: "address[]" }],
  },
  {
    type: "function",
    name: "tokenCountOf",
    stateMutability: "view",
    inputs: [{ name: "creator", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "event",
    name: "TokenCreated",
    inputs: [
      { name: "creator", type: "address", indexed: true },
      { name: "token", type: "address", indexed: true },
      { name: "name", type: "string", indexed: false },
      { name: "symbol", type: "string", indexed: false },
      { name: "supply", type: "uint256", indexed: false },
    ],
  },
] as const;

/**
 * The token mints `supply * 10**18`, so a UI-entered supply above this would
 * revert with an overflow deep inside the token instead of a clean form error.
 */
export const MAX_SUPPLY = (2n ** 256n - 1n) / 10n ** 18n;

export function parseSupply(input: string): ParsedAmount {
  if (typeof input !== "string" || input.includes(".")) {
    return { ok: false, reason: "Whole tokens only — supply has 18 decimals." };
  }
  const parsed = parseAmount(input, 18);
  if (!parsed.ok) return parsed;
  if (parsed.value % 10n ** 18n !== 0n) {
    return { ok: false, reason: "Whole tokens only — supply has 18 decimals." };
  }
  if (parsed.value / 10n ** 18n > MAX_SUPPLY) {
    return { ok: false, reason: "Supply is too large." };
  }
  return parsed;
}
