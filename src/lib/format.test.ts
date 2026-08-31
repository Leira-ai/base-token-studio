import assert from "node:assert/strict";
import test from "node:test";
import { formatBalance, parseAmount, truncateHex } from "./format.ts";

test("parseAmount rejects input that would otherwise reach the wallet", () => {
  assert.equal(parseAmount("", 18).ok, false);
  assert.equal(parseAmount("  ", 18).ok, false);
  assert.equal(parseAmount(".", 18).ok, false);
  assert.equal(parseAmount("abc", 18).ok, false);
  assert.equal(parseAmount("1.2.3", 18).ok, false);
  assert.equal(parseAmount("-1", 18).ok, false);
  assert.equal(parseAmount("0", 18).ok, false);
  assert.equal(parseAmount("0.0", 18).ok, false);
});

test("parseAmount refuses precision the token cannot hold", () => {
  const result = parseAmount("1.1234567", 6);
  assert.equal(result.ok, false);
  assert.match(result.ok ? "" : result.reason, /6 decimal places/);
});

test("parseAmount scales by token decimals", () => {
  const eth = parseAmount("1.5", 18);
  assert.equal(eth.ok && eth.value, 1_500_000_000_000_000_000n);

  const usdc = parseAmount("1.5", 6);
  assert.equal(usdc.ok && usdc.value, 1_500_000n);

  const trimmed = parseAmount("  2  ", 18);
  assert.equal(trimmed.ok && trimmed.value, 2_000_000_000_000_000_000n);
});

test("formatBalance truncates without inventing precision", () => {
  assert.equal(formatBalance(1_500_000_000_000_000_000n, 18), "1.5");
  assert.equal(formatBalance(0n, 18), "0");
  assert.equal(formatBalance(undefined, 18), "—");
  // 0.1234567891 at six places keeps the digits it can show, no rounding up.
  assert.equal(formatBalance(123_456_789_100_000_000n, 18), "0.123456");
  assert.equal(
    formatBalance(1_000_000_000_000_000_001n, 18, 18),
    "1.000000000000000001",
  );
});

test("truncateHex leaves short values alone", () => {
  const hash = `0x${"a".repeat(64)}`;
  assert.equal(truncateHex(hash), "0xaaaa…aaaa");
  assert.equal(truncateHex("0x1234"), "0x1234");
});
