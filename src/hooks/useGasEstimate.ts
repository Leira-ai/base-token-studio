"use client";

import { useEffect, useState } from "react";
import { type Hex } from "viem";
import { useAccount, useConfig } from "wagmi";
import { estimateFeesPerGas, estimateGas } from "wagmi/actions";
import { targetChain } from "@/lib/chain";
import { formatBalance } from "@/lib/format";

type GasRequest = {
  to: string;
  data: Hex;
  value?: bigint;
};

const CACHE_TTL = 30_000;

/** Module-level memo shared by every panel on the page. */
const cache = new Map<string, { at: number; cost: string }>();

function cacheKey(request: GasRequest, account: string): string {
  return [
    request.to,
    request.data,
    (request.value ?? 0n).toString(),
    account,
  ].join("|");
}

/**
 * Rough pre-sign network cost shown next to the submit button (Uniswap
 * pattern): estimated gas units times the chain's current fee estimate with a
 * 2x tip headroom. The wallet still shows the authoritative number; a failed
 * estimate (usually an input that would revert) simply hides the line.
 */
export function useGasEstimate(
  request: GasRequest | undefined,
  enabled: boolean,
) {
  const config = useConfig();
  const { address, chainId } = useAccount();
  const [estimate, setEstimate] = useState<string | undefined>(undefined);

  const ready = enabled && Boolean(request) && chainId === targetChain.id;

  useEffect(() => {
    // Reset inside the async body (post-await) rather than synchronously —
    // Next 16's react-hooks rules reject setState during effect setup.
    let cancelled = false;

    if (!ready || !request || !address) {
      void Promise.resolve().then(() => {
        if (!cancelled) setEstimate(undefined);
      });
      return () => {
        cancelled = true;
      };
    }

    const key = cacheKey(request, address);
    const cached = cache.get(key);
    const seeded = cached && Date.now() - cached.at < CACHE_TTL;

    (async () => {
      if (seeded) {
        setEstimate(cached!.cost);
        return;
      }
      setEstimate(undefined);
      try {
        const [gas, fees] = await Promise.all([
          estimateGas(config, {
            account: address,
            to: request.to as Hex,
            data: request.data,
            value: request.value,
          }),
          estimateFeesPerGas(config),
        ]);
        const maxFee = fees.maxFeePerGas ?? fees.gasPrice ?? 0n;
        const cost = gas * maxFee * 2n;
        const label = `~${formatBalance(cost, 18, 6)} ETH network fee`;
        cache.set(key, { at: Date.now(), cost: label });
        if (!cancelled) setEstimate(label);
      } catch {
        // A reverting estimate means the input would fail on-chain; the submit
        // path surfaces that. Keep the UI calm here.
        if (!cancelled) setEstimate(undefined);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [config, request, ready, address]);

  return estimate;
}
