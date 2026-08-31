import { getAddress, isAddress, type Address } from "viem";

export type Recipient =
  | { ok: true; address: Address; warning?: string }
  | { ok: false; reason: string };

/**
 * ERC-20 transfers to a token contract are unrecoverable and most wallets will
 * not stop you, so that case is rejected rather than merely warned about.
 *
 * The token address is a parameter rather than an import so this stays valid for
 * any ERC-20 and can be tested without the app's contract config.
 */
export function validateRecipient(
  input: string,
  context: { token: Address; self?: Address | undefined },
): Recipient {
  const trimmed = input.trim();
  if (!isAddress(trimmed)) {
    return { ok: false, reason: "Enter a valid 0x address." };
  }

  const address = getAddress(trimmed);
  if (address === getAddress(context.token)) {
    return {
      ok: false,
      reason: "That is the token contract. Tokens sent there are lost.",
    };
  }
  if (context.self && address === getAddress(context.self)) {
    return { ok: true, address, warning: "This is your own address." };
  }
  return { ok: true, address };
}
