"use client";

import { useCallback } from "react";
import { useAccount, useBalance, useReadContracts } from "wagmi";
import { WETH_ADDRESS, weth9Abi } from "@/lib/contracts";

/**
 * Balances are read as one multicall rather than three round trips, so the ETH
 * and WETH figures on screen always come from the same block. The query polls
 * every 10 seconds (and refetches when the tab refocuses) so incoming
 * transfers show up without a manual refresh.
 */
export function useBalances() {
  const { address } = useAccount();
  const enabled = Boolean(address);

  const eth = useBalance({
    address,
    query: { enabled, refetchInterval: 10_000 },
  });

  const weth = useReadContracts({
    allowFailure: false,
    contracts: [
      {
        address: WETH_ADDRESS,
        abi: weth9Abi,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
      },
      { address: WETH_ADDRESS, abi: weth9Abi, functionName: "decimals" },
      { address: WETH_ADDRESS, abi: weth9Abi, functionName: "symbol" },
    ],
    query: { enabled, refetchInterval: 10_000 },
  });

  // Depends on the query `refetch` functions, which are referentially stable,
  // rather than the query objects, so callers can safely use this in effects.
  const refetchEth = eth.refetch;
  const refetchWeth = weth.refetch;
  const refetch = useCallback(() => {
    void refetchEth();
    void refetchWeth();
  }, [refetchEth, refetchWeth]);

  const [wethBalance, wethDecimals, wethSymbol] = weth.data ?? [];

  // dataUpdatedAt is TanStack Query's own clock for the last successful fetch;
  // both queries poll together, so the fresher one is the truthful age.
  const updatedAt = Math.max(eth.dataUpdatedAt, weth.dataUpdatedAt);

  return {
    address,
    eth: {
      value: eth.data?.value,
      symbol: eth.data?.symbol ?? "ETH",
      decimals: eth.data?.decimals ?? 18,
      isLoading: eth.isLoading,
      error: eth.error,
    },
    weth: {
      value: wethBalance,
      symbol: wethSymbol ?? "WETH",
      decimals: wethDecimals ?? 18,
      isLoading: weth.isLoading,
      error: weth.error,
    },
    refetch,
    updatedAt,
  };
}
