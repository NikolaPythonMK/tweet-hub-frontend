"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type CursorPage<T> = {
  items: T[];
  nextCursor: string | null;
  hasNext: boolean;
};

type UseCursorListOptions<T> = {
  enabled: boolean;
  fetchPage: (cursor?: string | null) => Promise<CursorPage<T>>;
  deps?: readonly unknown[];
  auto?: boolean;
  onError?: (error: unknown) => void;
  onStart?: () => void;
};

export function useCursorList<T>({
  enabled,
  fetchPage,
  deps = [],
  auto = true,
  onError,
  onStart,
}: UseCursorListOptions<T>) {
  const onErrorRef = useRef(onError);
  const onStartRef = useRef(onStart);
  const [items, setItems] = useState<T[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    onErrorRef.current = onError;
    onStartRef.current = onStart;
  }, [onError, onStart]);

  const clear = useCallback(() => {
    setItems([]);
    setCursor(null);
    setHasNext(false);
    setLoaded(false);
  }, []);

  const loadPage = useCallback(
    async (reset: boolean, cursorOverride?: string | null) => {
      if (!enabled) {
        return;
      }
      setLoading(true);
      onStartRef.current?.();
      try {
        const nextCursor = reset ? undefined : cursorOverride ?? undefined;
        const response = await fetchPage(nextCursor ?? null);
        setItems((prev) => (reset ? response.items : [...prev, ...response.items]));
        setCursor(response.nextCursor ?? null);
        setHasNext(response.hasNext);
      } catch (err) {
        onErrorRef.current?.(err);
      } finally {
        setLoading(false);
        setLoaded(true);
      }
    },
    [enabled, fetchPage],
  );

  const reset = useCallback(() => {
    clear();
    if (enabled) {
      void loadPage(true, null);
    }
  }, [clear, enabled, loadPage]);

  const loadMore = useCallback(() => loadPage(false, cursor), [loadPage, cursor]);

  useEffect(() => {
    if (!enabled) {
      clear();
    }
  }, [clear, enabled]);

  useEffect(() => {
    if (!auto || !enabled) {
      return;
    }
    reset();
  }, [auto, enabled, reset, ...deps]);

  return { items, setItems, cursor, hasNext, loading, loaded, reset, loadMore };
}
