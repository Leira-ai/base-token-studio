import type { Address } from "viem";
import type { ParsedAmount } from "./format.ts";

/**
 * Set via NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS once the deploy script has run.
 * The Create Token panel stays disabled with an explanation until this exists,
 * so the app never points at a placeholder address.
 */
export const TOKEN_FACTORY_ADDRESS: Address | undefined = process.env
  .NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS as Address | undefined;

/** V2 factory adds burnable + on-chain metadata. Deployed 2026-08-31, Sourcify-verified. */
export const TOKEN_FACTORY_V2_ADDRESS: Address =
  "0xc9bF3F956E276767Aa32654f9A730864505aB4f0";

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
 * V2 ABI: createToken gains `burnable` plus on-chain description/imageURI, and
 * `tokenInfo(token)` reads that metadata back for the token page.
 */
export const factoryV2Abi = [
  {
    type: "function",
    name: "createToken",
    stateMutability: "nonpayable",
    inputs: [
      { name: "name", type: "string" },
      { name: "symbol", type: "string" },
      { name: "supply", type: "uint256" },
      { name: "burnable", type: "bool" },
      { name: "description", type: "string" },
      { name: "imageURI", type: "string" },
    ],
    outputs: [{ name: "token", type: "address" }],
  },
  {
    type: "function",
    name: "tokenInfo",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [
      { name: "description", type: "string" },
      { name: "imageURI", type: "string" },
      { name: "burnable", type: "bool" },
    ],
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
] as const;

export const MAX_DESCRIPTION_LENGTH = 280;
export const MAX_IMAGE_URI_LENGTH = 200;

/**
 * The token mints `supply * 10**18`, so a UI-entered supply above this would
 * revert with an overflow deep inside the token instead of a clean form error.
 */
export const MAX_SUPPLY = (2n ** 256n - 1n) / 10n ** 18n;

/**
 * Returns the supply in WHOLE tokens — the raw number the user typed. The
 * FactoryToken constructor applies the 10^18 scaling itself
 * (`_mint(supply_ * 10**decimals())`), so the UI must send 676767, not
 * 676767 * 10^18; scaling here too would mint 10^18 times more than asked.
 */
export function parseSupply(input: string): ParsedAmount {
  if (typeof input !== "string" || input.includes(".")) {
    return { ok: false, reason: "Whole tokens only — supply is an integer." };
  }
  const digitsOnly = input.replace(/\s/g, "");
  if (digitsOnly === "" || !/^\d+$/.test(digitsOnly)) {
    return { ok: false, reason: "Digits only — supply is an integer." };
  }
  let value: bigint;
  try {
    value = BigInt(digitsOnly);
  } catch {
    return { ok: false, reason: "Not a valid amount." };
  }
  if (value === 0n) {
    return { ok: false, reason: "Amount must be greater than zero." };
  }
  if (value > MAX_SUPPLY) {
    return { ok: false, reason: "Supply is too large." };
  }
  return { ok: true, value };
}
