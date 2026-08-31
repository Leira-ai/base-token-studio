"use client";

import { useCallback, useState } from "react";
import type { Hex } from "viem";
import { useConfig } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { useActivity } from "@/lib/activity";
import { useToasts } from "@/lib/toasts";
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
 *
 * Every phase change also drives a global toast (Uniswap pattern), so the
 * outcome is visible even when the user has scrolled away from the card that
 * started the transaction.
 */
export function useTxLifecycle(label: string) {
  const config = useConfig();
  const { record } = useActivity();
  const { push, update } = useToasts();

  const [phase, setPhase] = useState<TxPhase>("idle");
  const [hash, setHash] = useState<Hex | undefined>(undefined);
  const [error, setError] = useState<FriendlyError | null>(null);

  const run = useCallback(
    async (submit: () => Promise<Hex>): Promise<boolean> => {
      setError(null);
      setHash(undefined);
      setPhase("signing");
      const toastId = push({ label, status: "pending", message: "Confirm in your wallet…" });

      let submitted: Hex | undefined;
      try {
        submitted = await submit();
        setHash(submitted);
        setPhase("pending");
        record(submitted, label, "pending");
        update(toastId, {
          status: "pending",
          message: "Submitted, waiting for confirmation…",
          hash: submitted,
        });

        const receipt = await waitForTransactionReceipt(config, {
          hash: submitted,
          confirmations: 1,
        });

        if (receipt.status === "reverted") {
          setPhase("error");
          setError(REVERTED);
          record(submitted, label, "error");
          update(toastId, { status: "error", message: REVERTED.message });
          return false;
        }

        setPhase("success");
        record(submitted, label, "success");
        update(toastId, { status: "success", message: "Confirmed." });
        return true;
      } catch (caught) {
        setPhase("error");
        const friendly = toFriendlyError(caught);
        setError(friendly);
        if (submitted) record(submitted, label, "error");
        update(toastId, {
          status: "error",
          message: friendly?.message ?? "Something went wrong.",
        });
        return false;
      }
    },
    [config, label, record, push, update],
  );

  const reset = useCallback(() => {
    setPhase("idle");
    setHash(undefined);
    setError(null);
  }, []);

  return { phase, hash, error, run, reset };
}

export type TxLifecycle = ReturnType<typeof useTxLifecycle>;
