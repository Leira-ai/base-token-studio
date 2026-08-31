import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import { injected } from "wagmi/connectors/injected";
import { coinbaseWallet } from "wagmi/connectors/coinbaseWallet";
import { rpcUrl, targetChain } from "@/lib/chain";

/**
 * Cookie storage (rather than the default localStorage) lets the server render
 * a first paint that already knows whether a wallet was connected, which avoids
 * a connect-button flash on reload.
 */
export function getConfig() {
  return createConfig({
    chains: [targetChain],
    connectors: [
      injected(),
      coinbaseWallet({ appName: "Base Token Studio" }),
    ],
    transports: {
      [targetChain.id]: http(rpcUrl),
    },
    storage: createStorage({ storage: cookieStorage }),
    ssr: true,
  });
}

declare module "wagmi" {
  interface Register {
    config: ReturnType<typeof getConfig>;
  }
}
