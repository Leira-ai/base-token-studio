"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, type State } from "wagmi";
import { ActivityProvider } from "@/lib/activity";
import { ToastProvider } from "@/lib/toasts";
import { getConfig } from "@/lib/wagmi";

export function Providers({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState: State | undefined;
}) {
  // Created in state so a re-render never swaps the config or cache identity.
  const [config] = useState(() => getConfig());
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10_000,
            retry: 1,
            refetchOnWindowFocus: true,
          },
        },
      }),
  );

  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <ActivityProvider>
          <ToastProvider>{children}</ToastProvider>
        </ActivityProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
