"use client";

import { TOKEN_FACTORY_ADDRESS } from "@/lib/factory";
import { explorerAddressUrl, targetChain } from "@/lib/chain";
import { Card } from "@/components/ui/Card";

/**
 * Revoke.cash-style honest trust panel: what the factory guarantees on-chain,
 * and what this tool cannot protect you from. No competitor in the token
 * creator category discloses either side.
 */
export function TrustPanel() {
  return (
    <Card
      title="Trust & security"
      description="Claims you can verify on-chain, and the limits we won't hide."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-positive">
            Guaranteed by the contract
          </h3>
          <ul className="mt-2 space-y-1.5 text-xs text-ink-muted">
            <li>
              ✓ Supply is <strong className="text-ink">fixed at creation</strong> — no mint
              function exists to inflate it later.
            </li>
            <li>
              ✓ <strong className="text-ink">No owner, no admin</strong> — there is no key
              that can pause, seize, or modify your token.
            </li>
            <li>
              ✓ The factory holds no funds and cannot touch your tokens.
            </li>
            <li>
              ✓{" "}
              <a
                href={`https://repo.sourcify.dev/contracts/partial_match/84532/${TOKEN_FACTORY_ADDRESS}`}
                target="_blank"
                rel="noreferrer noopener"
                className="text-accent underline decoration-dotted underline-offset-2"
              >
                Source verified (Sourcify exact-match)
              </a>{" "}
              — read the code you are calling.{" "}
              <a
                href={explorerAddressUrl(TOKEN_FACTORY_ADDRESS ?? "")}
                target="_blank"
                rel="noreferrer noopener"
                className="text-accent underline decoration-dotted underline-offset-2"
              >
                Factory on Basescan
              </a>
              .
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-caution">
            What this tool cannot do
          </h3>
          <ul className="mt-2 space-y-1.5 text-xs text-ink-muted">
            <li>
              A token named anything can still be used in a scam by someone
              else — owning the symbol is not endorsement.
            </li>
            <li>
              {targetChain.name} testnet tokens have <strong className="text-ink">no
              monetary value</strong>; nothing here touches mainnet funds.
            </li>
            <li>
              This app never asks for your seed phrase or private key. Any site
              that does is a phishing site — including one that looks like this.
            </li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
