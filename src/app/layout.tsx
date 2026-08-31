import type { Metadata } from "next";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { cookieToInitialState } from "wagmi";
import { getConfig } from "@/lib/wagmi";
import { Providers } from "@/app/providers";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Base Token Studio",
  description:
    "Create fixed-supply ERC-20 tokens, wrap and unwrap WETH, and send transfers on Base Sepolia.",
  icons: { icon: "/favicon.svg" },
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Reading the wagmi cookie on the server means a reconnected wallet is part of
  // the first paint instead of appearing a beat later.
  const initialState = cookieToInitialState(
    getConfig(),
    (await headers()).get("cookie"),
  );

  return (
    <html lang="en">
      <body>
        <Providers initialState={initialState}>{children}</Providers>
      </body>
    </html>
  );
}
