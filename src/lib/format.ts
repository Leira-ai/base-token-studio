import { formatUnits, parseUnits } from "viem";

export type ParsedAmount =
  | { ok: true; value: bigint }
  | { ok: false; reason: string };

const NUMERIC = /^\d*\.?\d*$/;

/**
 * Validates before parsing because `parseUnits` throws on malformed input and
 * silently truncates extra precision, both of which would surface to the user
 * as a failed transaction rather than a form error.
 */
export function parseAmount(input: string, decimals: number): ParsedAmount {
  const trimmed = input.trim();
  if (trimmed === "" || trimmed === ".") {
    return { ok: false, reason: "Enter an amount." };
  }
  if (!NUMERIC.test(trimmed)) {
    return { ok: false, reason: "Digits and a single decimal point only." };
  }

  const fraction = trimmed.split(".")[1] ?? "";
  if (fraction.length > decimals) {
    return { ok: false, reason: `At most ${decimals} decimal places.` };
  }

  let value: bigint;
  try {
    value = parseUnits(trimmed, decimals);
  } catch {
    return { ok: false, reason: "Not a valid amount." };
  }

  if (value === 0n) {
    return { ok: false, reason: "Amount must be greater than zero." };
  }
  return { ok: true, value };
}

/** Fixed precision keeps column widths stable; full precision goes in the title attribute. */
export function formatBalance(
  value: bigint | undefined,
  decimals: number,
  precision = 6,
): string {
  if (value === undefined) return "—";
  const full = formatUnits(value, decimals);
  const [whole, fraction] = full.split(".");
  if (!fraction) return whole ?? "0";
  const shown = fraction.slice(0, precision).replace(/0+$/, "");
  return shown ? `${whole}.${shown}` : (whole ?? "0");
}

export function formatFull(value: bigint | undefined, decimals: number): string {
  return value === undefined ? "—" : formatUnits(value, decimals);
}

export function truncateHex(value: string, lead = 6, tail = 4): string {
  if (value.length <= lead + tail + 2) return value;
  return `${value.slice(0, lead)}…${value.slice(-tail)}`;
}
