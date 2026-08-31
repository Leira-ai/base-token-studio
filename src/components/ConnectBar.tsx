"use client";

import { useAccount, useConnect, useConnectors, useDisconnect } from "wagmi";
import { explorerAddressUrl } from "@/lib/chain";
import { truncateHex } from "@/lib/format";
import { toFriendlyError } from "@/lib/errors";
import { Button, Spinner } from "@/components/ui/Button";

export function ConnectBar() {
  const { address, isConnected } = useAccount();
  const connectors = useConnectors();
  const connect = useConnect();
  const disconnect = useDisconnect();

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
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        {connectors.map((connector) => {
          const isBusy =
            connect.isPending && connect.variables?.connector === connector;
          return (
            <Button
              key={connector.uid}
              variant="secondary"
              disabled={connect.isPending}
              onClick={() => connect.mutate({ connector })}
            >
              {isBusy ? <Spinner label="Connecting" /> : null}
              {connector.name}
            </Button>
          );
        })}
      </div>
      {error ? (
        <p
          role="alert"
          className={`text-xs ${error.isRejection ? "text-caution" : "text-negative"}`}
        >
          {error.message}
        </p>
      ) : null}
    </div>
  );
}
