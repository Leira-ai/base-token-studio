"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount, useConnect, useConnectors, useDisconnect } from "wagmi";
import { explorerAddressUrl } from "@/lib/chain";
import { truncateHex } from "@/lib/format";
import { toFriendlyError } from "@/lib/errors";
import { Button, Spinner } from "@/components/ui/Button";

/**
 * One button in the navbar; the connector list lives in a dropdown instead of
 * a row of buttons, since injected-provider discovery can surface 8+ wallets.
 */
export function ConnectBar() {
  const { address, isConnected } = useAccount();
  const connectors = useConnectors();
  const connect = useConnect();
  const disconnect = useDisconnect();

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <a
          href={explorerAddressUrl(address)}
          target="_blank"
          rel="noreferrer noopener"
          className="rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 font-mono text-xs hover:border-accent/60"
        >
          {truncateHex(address)}
        </a>
        <Button variant="ghost" onClick={() => disconnect.mutate()}>
          Disconnect
        </Button>
      </div>
    );
  }

  const error = toFriendlyError(connect.error);

  return (
    <div ref={menuRef} className="relative flex flex-col items-end gap-2">
      <Button
        variant="secondary"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        Connect wallet
      </Button>

      {open ? (
        <div
          role="menu"
          aria-label="Wallet options"
          className="absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-border-subtle bg-surface-raised p-1.5 shadow-xl"
        >
          {connectors.map((connector) => {
            const isBusy =
              connect.isPending && connect.variables?.connector === connector;
            return (
              <button
                key={connector.uid}
                role="menuitem"
                type="button"
                disabled={connect.isPending}
                onClick={() => connect.mutate({ connector })}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface disabled:opacity-45"
              >
                {isBusy ? <Spinner label="Connecting" /> : null}
                {connector.name}
              </button>
            );
          })}
          {error ? (
            <p
              role="alert"
              className={`px-3 py-2 text-xs ${error.isRejection ? "text-caution" : "text-negative"}`}
            >
              {error.message}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
