# Base Token Studio

A small Base Sepolia dApp: read ETH and WETH balances, wrap and unwrap ETH through the canonical WETH9 predeploy, and send ERC-20 transfers. Testnet only.

Built to show how I handle the parts of dApp frontend work that usually get skipped — transaction lifecycle, wallet error handling, and input validation that runs before a user pays gas to discover a mistake.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · wagmi 3 · viem 2 · TanStack Query 5 · Tailwind CSS 4

No wallet-connection kit. The connector list is short enough that adding one would mean shipping a large dependency and its theming layer for a button, so the app uses wagmi's injected and Coinbase Wallet connectors directly.

## Running it

```bash
npm install
npm run dev
```

You need a wallet on Base Sepolia and some test ETH from a [Base Sepolia faucet](https://docs.base.org/chain/network-faucets).

The public RPC is rate limited. For anything beyond casual use, copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL` to a dedicated endpoint.

```bash
npm run verify   # typecheck, lint, tests, production build
```

## Technical decisions

**One transaction phase instead of four booleans.** A write goes through sign → submit → confirm, and each stage fails differently. wagmi exposes this as a mutation plus a separate receipt query, so UI code ends up reading `isPending`, `isLoading`, two error objects, and a receipt status to answer "what is happening right now."

`useTxLifecycle` (`src/hooks/useTxLifecycle.ts`) awaits the whole sequence and reduces it to one `TxPhase`. It takes the caller's submit function rather than a request object, which keeps wagmi's ABI type inference intact at the call site and means the caller can react to the result in its own event handler instead of an effect watching query state.

The distinction that matters: a transaction that gets a hash and then reverts is a **failure**. The mutation alone reports success as soon as the hash exists, so the hook waits for the receipt and checks `status === "reverted"` before telling the caller it worked.

**Validation happens before the wallet opens.** `parseAmount` (`src/lib/format.ts`) rejects empty input, non-numeric characters, zero, and precision the token cannot represent. That last one matters: `parseUnits` silently truncates extra decimal places, so `1.1234567` on a 6-decimal token would send a different amount than the user typed.

`validateRecipient` (`src/lib/recipient.ts`) rejects transfers to the token contract itself. Most wallets will sign that transaction, and the tokens are gone. It warns on self-sends rather than blocking them, since that is occasionally deliberate.

**Wallet errors get one sentence.** Wallet and RPC failures arrive as deep cause chains whose top-level message is a stack trace. `toFriendlyError` (`src/lib/errors.ts`) walks the chain with viem's `walk` to find the meaningful cause and maps rejections, insufficient funds, and contract reverts to plain language. A user rejection is styled as a neutral outcome, not an error, because cancelling is a normal thing to do.

**Balances come from one multicall.** ETH and WETH are read together via `useReadContracts`, so the two figures on screen always belong to the same block instead of drifting apart across three separate round trips.

**Max leaves room for gas.** Wrapping the entire ETH balance would leave nothing to pay for the wrap. "Max" subtracts a small fixed headroom rather than estimating gas, quoting a number, and then estimating again at submit time.

**The wrong network disables actions rather than hiding them.** A wallet on another chain can still sign a transaction that then executes against nothing, so `NetworkGuard` surfaces a switch prompt and the panels stay disabled until the chain matches.

**Connection state is server-rendered.** wagmi's state is stored in a cookie and hydrated in the root layout, so a reconnected wallet is part of the first paint instead of flashing a connect button on every reload.

## Tests

```bash
npm test
```

Ten tests over the pure logic — amount parsing, balance formatting, and recipient validation — using Node's built-in test runner, so there is no test framework dependency to maintain. These are the functions where a silent bug costs a user real money; the wagmi-dependent code is covered by manual testing against Base Sepolia.

## Accessibility

Inputs are labelled and wired to their error text with `aria-describedby` and `aria-invalid`. Transaction status updates through an `aria-live` region. Focus rings are visible for keyboard users. Spinners carry accessible labels rather than being decorative divs. Motion respects `prefers-reduced-motion`.

## Out of scope

Mainnet, arbitrary token lists, gas estimation display, and transaction history beyond the current session. This targets one chain and one token pair on purpose — the goal was depth on the transaction path, not breadth.

## Security note

This app never holds keys and never asks for a seed phrase or private key. Every transaction is signed in your own wallet. It targets a testnet, so no real funds are at risk.
