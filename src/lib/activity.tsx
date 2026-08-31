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

export type ActivityStatus = "pending" | "success" | "error";

export type ActivityEntry = {
  hash: Hex;
  label: string;
  status: ActivityStatus;
  at: number;
};

type ActivityContextValue = {
  entries: readonly ActivityEntry[];
  record: (hash: Hex, label: string, status: ActivityStatus) => void;
  clear: () => void;
};

const ActivityContext = createContext<ActivityContextValue | null>(null);

const MAX_ENTRIES = 8;

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<readonly ActivityEntry[]>([]);

  const record = useCallback(
    (hash: Hex, label: string, status: ActivityStatus) => {
      setEntries((current) => {
        const existing = current.find((entry) => entry.hash === hash);
        if (existing) {
          if (existing.status === status) return current;
          return current.map((entry) =>
            entry.hash === hash ? { ...entry, status } : entry,
          );
        }
        return [{ hash, label, status, at: Date.now() }, ...current].slice(
          0,
          MAX_ENTRIES,
        );
      });
    },
    [],
  );

  const clear = useCallback(() => setEntries([]), []);

  const value = useMemo(
    () => ({ entries, record, clear }),
    [entries, record, clear],
  );

  return (
    <ActivityContext.Provider value={value}>
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivity(): ActivityContextValue {
  const value = useContext(ActivityContext);
  if (!value) {
    throw new Error("useActivity must be used inside <ActivityProvider>.");
  }
  return value;
}
