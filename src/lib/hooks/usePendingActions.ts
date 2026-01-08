"use client";

import { useCallback, useState } from "react";

type PendingActionsOptions = {
  onError?: (error: unknown) => void;
  onStart?: () => void;
};

export function usePendingActions(options: PendingActionsOptions = {}) {
  const { onError, onStart } = options;
  const [pending, setPending] = useState<Set<string>>(new Set());

  const runAction = useCallback(
    async (key: string, action: () => Promise<void>) => {
      setPending((prev) => {
        const next = new Set(prev);
        next.add(key);
        return next;
      });
      onStart?.();
      try {
        await action();
      } catch (err) {
        onError?.(err);
      } finally {
        setPending((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [onError, onStart],
  );

  const isPending = useCallback((key: string) => pending.has(key), [pending]);

  return { pending, runAction, isPending };
}
