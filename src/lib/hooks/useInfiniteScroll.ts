import { useCallback, useEffect, useRef } from "react";

type UseInfiniteScrollOptions<T extends Element> = {
  enabled: boolean;
  onIntersect: (target: T) => void;
  rootMargin?: string;
  deps?: readonly unknown[];
};

export function useInfiniteScroll<T extends Element>({
  enabled,
  onIntersect,
  rootMargin = "200px",
  deps = [],
}: UseInfiniteScrollOptions<T>) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const nodesRef = useRef<Set<T>>(new Set());
  const onIntersectRef = useRef(onIntersect);

  useEffect(() => {
    onIntersectRef.current = onIntersect;
  }, [onIntersect]);

  const pruneNodes = useCallback(() => {
    nodesRef.current.forEach((node) => {
      if (!node.isConnected) {
        nodesRef.current.delete(node);
      }
    });
  }, []);

  const observeNodes = useCallback(() => {
    const observer = observerRef.current;
    if (!observer) {
      return;
    }
    pruneNodes();
    nodesRef.current.forEach((node) => observer.observe(node));
  }, [pruneNodes]);

  useEffect(() => {
    if (!enabled) {
      observerRef.current?.disconnect();
      observerRef.current = null;
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          const target = entry.target as T;
          observer.unobserve(target);
          onIntersectRef.current(target);
        });
      },
      { rootMargin },
    );
    observerRef.current = observer;
    observeNodes();
    return () => observer.disconnect();
  }, [enabled, observeNodes, rootMargin]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    observeNodes();
  }, [enabled, observeNodes, ...deps]);

  return useCallback(
    (node: T | null) => {
      if (!node) {
        return;
      }
      nodesRef.current.add(node);
      if (enabled && observerRef.current) {
        observerRef.current.observe(node);
      }
    },
    [enabled],
  );
}
