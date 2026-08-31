import assert from "node:assert/strict";
import test from "node:test";
import type { Address } from "viem";
import { validateRecipient } from "./recipient.ts";

const TOKEN: Address = "0x4200000000000000000000000000000000000006";
const ALICE: Address = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const BOB: Address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

test("rejects anything that is not an address", () => {
  for (const input of ["", "not-an-address", "0x123", ALICE.slice(0, -1)]) {
    assert.equal(validateRecipient(input, { token: TOKEN }).ok, false);
  }
});

test("rejects the token contract itself", () => {
  const result = validateRecipient(TOKEN, { token: TOKEN });
  assert.equal(result.ok, false);
  assert.match(result.ok ? "" : result.reason, /token contract/);
});

test("rejects the token contract regardless of input casing", () => {
  const result = validateRecipient(TOKEN.toLowerCase(), { token: TOKEN });
  assert.equal(result.ok, false);
});

test("accepts a valid address and returns it checksummed", () => {
  const result = validateRecipient(` ${ALICE.toLowerCase()} `, {
    token: TOKEN,
    self: BOB,
  });
  assert.equal(result.ok, true);
  assert.equal(result.ok && result.address, ALICE);
  assert.equal(result.ok && result.warning, undefined);
});

test("warns but allows sending to yourself", () => {
  const result = validateRecipient(ALICE, { token: TOKEN, self: ALICE });
  assert.equal(result.ok, true);
  assert.match(result.ok ? (result.warning ?? "") : "", /your own address/);
});
