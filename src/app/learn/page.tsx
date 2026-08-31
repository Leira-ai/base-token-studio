import type { Metadata } from "next";
import Link from "next/link";
import { TOKEN_FACTORY_ADDRESS } from "@/lib/factory";
import { targetChain } from "@/lib/chain";

export const metadata: Metadata = {
  title: "Learn — Base Token Studio",
  description:
    "Short, honest answers: why tokens have 18 decimals, what gas is, why testnets exist, and how to stay safe.",
};

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "Why does my token show extra zeros on explorers?",
    a: (
      <>
        ERC-20 tokens store amounts in <strong>base units</strong>. The{" "}
        <code className="font-mono text-xs">decimals()</code> value (usually 18,
        like ETH) says how many base units make one whole token. Explorers
        always display <em>raw amount ÷ 10^decimals</em>: a supply of 1,000
        tokens is stored as 1,000,000,000,000,000,000,000 base units. Your meme
        token showed &quot;1000&quot; because its creator chose fewer (or zero) decimals —
        both are valid; 18 is the ecosystem default, and this studio follows it.
      </>
    ),
  },
  {
    q: "What is gas, and why am I paying it?",
    a: (
      <>
        Gas is the fee the network charges to run your transaction — it pays the
        validators who include it in a block. It is paid in the chain&apos;s native
        token (ETH on Base), not in the token you are creating. Base is an
        <strong> L2</strong>: fees are typically fractions of a cent. This app
        shows a live estimate before you sign; your wallet then shows the
        authoritative figure.
      </>
    ),
  },
  {
    q: "Why is this on a testnet?",
    a: (
      <>
        {targetChain.name} is Base&apos;s rehearsal network: everything works the
        same, but the ETH is free from a faucet and owns nothing of value. It
        lets you learn, test, and demo without risking real money. The same
        factory can be deployed to Base mainnet unchanged when you are ready.
      </>
    ),
  },
  {
    q: "What is an ERC-20 token, exactly?",
    a: (
      <>
        A smart contract implementing a standard interface:{" "}
        <code className="font-mono text-xs">name</code>,{" "}
        <code className="font-mono text-xs">symbol</code>,{" "}
        <code className="font-mono text-xs">decimals</code>,{" "}
        <code className="font-mono text-xs">totalSupply</code>, balances, and
        transfers. Because everyone agrees on the interface, wallets, explorers,
        and DEXes can display and trade your token with zero extra work. That
        standardization is why &quot;a token&quot; means something concrete on EVM chains.
      </>
    ),
  },
  {
    q: "How does this tool avoid being a rug-pull vector?",
    a: (
      <>
        Every token it creates has <strong>fixed supply</strong> (no mint
        function), <strong>no owner</strong>, and no admin controls — there is
        no key that can change anything after deployment. The factory holds no
        funds. What we cannot prevent: other people using your token&apos;s name in
        scams, or you sending tokens to a wrong address — transfers are final.
        See the Trust &amp; security panel in the app for the full disclosure.
      </>
    ),
  },
];

export default function LearnPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="rise-in mb-8">
        <h1 className="text-xl font-semibold tracking-tight">Learn</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Short, honest answers to the questions every token creator hits.
        </p>
      </header>

      <div className="rise-in space-y-3">
        {FAQS.map((faq, index) => (
          <details
            key={index}
            className="group rounded-xl border border-border-subtle bg-surface p-5 transition-colors hover:border-border-hover"
          >
            <summary className="cursor-pointer list-none text-sm font-semibold marker:hidden">
              <span
                aria-hidden
                className="mr-2 inline-block text-accent transition-transform group-open:rotate-90"
              >
                ▸
              </span>
              {faq.q}
            </summary>
            <p className="mt-3 pl-6 text-sm leading-relaxed text-ink-muted">
              {faq.a}
            </p>
          </details>
        ))}
      </div>

      <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-muted">
        <span>
          Factory:{" "}
          <code className="font-mono">{TOKEN_FACTORY_ADDRESS}</code>{" "}
          (Sourcify-verified)
        </span>
        <Link
          href="/"
          className="text-accent underline decoration-dotted underline-offset-2"
        >
          ← Back to the studio
        </Link>
      </footer>
    </main>
  );
}
