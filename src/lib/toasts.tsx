"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Hex } from "viem";
import { explorerTxUrl } from "@/lib/chain";
import { truncateHex } from "@/lib/format";

export type ToastStatus = "pending" | "success" | "error";

export type Toast = {
  id: number;
  label: string;
  status: ToastStatus;
  hash?: Hex;
  message?: string;
};

type ToastContextValue = {
  toasts: readonly Toast[];
  push: (toast: Omit<Toast, "id">) => number;
  update: (id: number, patch: Partial<Omit<Toast, "id">>) => void;
  dismiss: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const MAX_TOASTS = 4;

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<readonly Toast[]>([]);

  const push = useCallback((toast: Omit<Toast, "id">): number => {
    const id = nextId++;
    setToasts((current) =>
      [{ id, ...toast }, ...current].slice(0, MAX_TOASTS),
    );
    return id;
  }, []);

  const update = useCallback(
    (id: number, patch: Partial<Omit<Toast, "id">>) => {
      setToasts((current) =>
        current.map((toast) =>
          toast.id === id ? { ...toast, ...patch } : toast,
        ),
      );
    },
    [],
  );

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const value = useMemo(
    () => ({ toasts, push, update, dismiss }),
    [toasts, push, update, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}

export function useToasts(): ToastContextValue {
  const value = useContext(ToastContext);
  if (!value) {
    throw new Error("useToasts must be used inside <ToastProvider>.");
  }
  return value;
}

const statusIcon: Record<ToastStatus, string> = {
  pending: "◌",
  success: "✓",
  error: "×",
};

const statusColor: Record<ToastStatus, string> = {
  pending: "text-caution",
  success: "text-positive",
  error: "text-negative",
};

/**
 * Fixed bottom-right stack (Uniswap pattern): every transaction surfaces here
 * on submit and on resolution, with an explorer link, independent of whichever
 * card the user has scrolled past.
 */
export function ToastStack() {
  const { toasts, dismiss } = useToasts();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="rise-in rounded-xl border border-border-subtle bg-surface-raised p-3.5 shadow-xl"
        >
          <div className="flex items-start gap-2.5">
            <span
              aria-hidden
              className={`mt-0.5 font-semibold ${statusColor[toast.status]}`}
            >
              {statusIcon[toast.status]}
            </span>
            <div className="min-w-0 flex-1 text-xs">
              <p className="font-medium text-ink">{toast.label}</p>
              {toast.message ? (
                <p
                  className={
                    toast.status === "error" &&
                    toast.message !== "You rejected the request in your wallet."
                      ? "mt-0.5 text-negative"
                      : "mt-0.5 text-ink-muted"
                  }
                >
                  {toast.message}
                </p>
              ) : null}
              {toast.hash ? (
                <a
                  href={explorerTxUrl(toast.hash)}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-0.5 inline-block font-mono text-accent underline decoration-dotted underline-offset-2"
                >
                  {truncateHex(toast.hash, 10, 6)}
                </a>
              ) : null}
            </div>
            {toast.status !== "pending" ? (
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => dismiss(toast.id)}
                className="shrink-0 text-ink-muted hover:text-ink"
              >
                ×
              </button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
