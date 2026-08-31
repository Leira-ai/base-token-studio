import assert from "node:assert/strict";
import test from "node:test";
import { parseSupply } from "./factory.ts";

test("parseSupply rejects fractional supplies", () => {
  assert.equal(parseSupply("1.5").ok, false);
  assert.equal(parseSupply("1.").ok, false);
});

test("parseSupply rejects non-numeric input", () => {
  assert.equal(parseSupply("").ok, false);
  assert.equal(parseSupply("abc").ok, false);
  assert.equal(parseSupply("-1").ok, false);
  assert.equal(parseSupply("0").ok, false);
  assert.equal(parseSupply("0.0").ok, false);
});

test("parseSupply passes whole tokens through UNSCALED", () => {
  // The contract applies 10^18 itself; the UI sends the plain integer.
  const result = parseSupply("1000");
  assert.equal(result.ok && result.value, 1000n);

  const big = parseSupply("676767");
  assert.equal(big.ok && big.value, 676_767n);
});

test("parseSupply accepts the maximum representable supply", () => {
  const max = parseSupply(((2n ** 256n - 1n) / 10n ** 18n).toString());
  assert.equal(max.ok, true);

  const over = parseSupply(((2n ** 256n - 1n) / 10n ** 18n + 1n).toString());
  assert.equal(over.ok, false);
});
