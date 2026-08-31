"use client";

import { useCallback, useState } from "react";
import type { Hex } from "viem";
import { useConfig } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { useActivity } from "@/lib/activity";
import { toFriendlyError, type FriendlyError } from "@/lib/errors";

export type TxPhase = "idle" | "signing" | "pending" | "success" | "error";

const REVERTED: FriendlyError = {
  message: "The transaction reverted on-chain.",
  isRejection: false,
};

/**
 * Owns the lifecycle of one write — sign, submit, wait for the receipt — and
 * collapses it into a single phase plus a friendly error.
 *
 * The caller passes its own submit function (usually `writeContractAsync`)
 * rather than a request object, which keeps wagmi's ABI inference intact and
 * lets the caller react to the outcome in its event handler instead of an
 * effect that watches query state. Resolves to whether the receipt confirmed,
 * so a submitted hash that reverts is reported as a failure.
 */
export function useTxLifecycle(label: string) {
  const config = useConfig();
  const { record } = useActivity();

  const [phase, setPhase] = useState<TxPhase>("idle");
  const [hash, setHash] = useState<Hex | undefined>(undefined);
  const [error, setError] = useState<FriendlyError | null>(null);

  const run = useCallback(
    async (submit: () => Promise<Hex>): Promise<boolean> => {
      setError(null);
      setHash(undefined);
      setPhase("signing");

      let submitted: Hex | undefined;
      try {
        submitted = await submit();
        setHash(submitted);
        setPhase("pending");
        record(submitted, label, "pending");

        const receipt = await waitForTransactionReceipt(config, {
          hash: submitted,
          confirmations: 1,
        });

        if (receipt.status === "reverted") {
          setPhase("error");
          setError(REVERTED);
          record(submitted, label, "error");
          return false;
        }

        setPhase("success");
        record(submitted, label, "success");
        return true;
      } catch (caught) {
        setPhase("error");
        setError(toFriendlyError(caught));
        if (submitted) record(submitted, label, "error");
        return false;
      }
    },
    [config, label, record],
  );

  const reset = useCallback(() => {
    setPhase("idle");
    setHash(undefined);
    setError(null);
  }, []);

  return { phase, hash, error, run, reset };
}

export type TxLifecycle = ReturnType<typeof useTxLifecycle>;
