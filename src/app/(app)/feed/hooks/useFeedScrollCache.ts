"use client";

import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { PostTimeRange, PostView } from "@/lib/api/types";

type UseFeedScrollCacheOptions = {
  userId: string | null;
  pathname: string;
  timeRange: PostTimeRange | "";
  posts: PostView[];
  cursor: string | null;
  hasNext: boolean;
  setPosts: Dispatch<SetStateAction<PostView[]>>;
  setCursor: Dispatch<SetStateAction<string | null>>;
  setHasNext: Dispatch<SetStateAction<boolean>>;
  loadPosts: (reset: boolean, cursorOverride?: string | null) => Promise<void>;
};

export function useFeedScrollCache({
  userId,
  pathname,
  timeRange,
  posts,
  cursor,
  hasNext,
  setPosts,
  setCursor,
  setHasNext,
  loadPosts,
}: UseFeedScrollCacheOptions) {
  const [restoreTarget, setRestoreTarget] = useState<number | null>(null);
  const restoreAttemptsRef = useRef(0);
  const restoreTimeoutRef = useRef<number | null>(null);
  const restoreDeadlineRef = useRef<number | null>(null);
  const restoreIntervalRef = useRef<number | null>(null);
  const scrollSaveTicking = useRef(false);
  const cacheHydrated = useRef(false);
  const cacheTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId || pathname !== "/feed") {
      return;
    }
    const cacheToken = `${userId}:${timeRange || "all"}`;
    if (cacheTokenRef.current !== cacheToken) {
      cacheHydrated.current = false;
      cacheTokenRef.current = cacheToken;
    }
    const restoreKey = "feed:restore";
    const lockKey = "feed:lock";
    const shouldRestore = sessionStorage.getItem(restoreKey) === "1";
    const cacheKey = `feed:cache:${cacheToken}`;
    if (shouldRestore) {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as {
            posts: PostView[];
            cursor: string | null;
            hasNext: boolean;
          };
          if (Array.isArray(parsed.posts)) {
            setPosts(parsed.posts);
            setCursor(parsed.cursor ?? null);
            setHasNext(parsed.hasNext ?? false);
            cacheHydrated.current = true;
          }
        } catch {
          sessionStorage.removeItem(cacheKey);
        }
      }
    }
    const stored = sessionStorage.getItem("feed:scrollY");
    if (shouldRestore && stored) {
      const value = Number(stored);
      if (!Number.isNaN(value)) {
        setRestoreTarget(value);
      }
    } else {
      sessionStorage.removeItem(lockKey);
    }
    if (!cacheHydrated.current) {
      void loadPosts(true, null);
    }
  }, [loadPosts, pathname, setCursor, setHasNext, setPosts, timeRange, userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }
    return () => {
      const alreadySaved = sessionStorage.getItem("feed:restore") === "1";
      if (alreadySaved) {
        return;
      }
      sessionStorage.setItem("feed:restore", "1");
      sessionStorage.setItem("feed:scrollY", String(window.scrollY));
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }
    const handleScroll = () => {
      if (sessionStorage.getItem("feed:lock") === "1") {
        return;
      }
      if (scrollSaveTicking.current) {
        return;
      }
      scrollSaveTicking.current = true;
      requestAnimationFrame(() => {
        sessionStorage.setItem("feed:scrollY", String(window.scrollY));
        scrollSaveTicking.current = false;
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [userId]);

  useEffect(() => {
    if (restoreTarget === null) {
      return;
    }
    restoreAttemptsRef.current = 0;
    restoreDeadlineRef.current = Date.now() + 3000;
    if (restoreTimeoutRef.current) {
      window.clearTimeout(restoreTimeoutRef.current);
      restoreTimeoutRef.current = null;
    }
    if (restoreIntervalRef.current) {
      window.clearInterval(restoreIntervalRef.current);
      restoreIntervalRef.current = null;
    }
    let cancelled = false;
    const stopRestore = () => {
      if (restoreIntervalRef.current) {
        window.clearInterval(restoreIntervalRef.current);
        restoreIntervalRef.current = null;
      }
      restoreDeadlineRef.current = null;
      setRestoreTarget(null);
      sessionStorage.removeItem("feed:scrollY");
      sessionStorage.removeItem("feed:restore");
      sessionStorage.removeItem("feed:lock");
    };
    const handleScroll = (event: Event) => {
      if (cancelled) {
        return;
      }
      const isTrusted = "isTrusted" in event ? event.isTrusted : false;
      if (!isTrusted) {
        return;
      }
      stopRestore();
    };
    const attemptRestore = () => {
      if (cancelled || restoreTarget === null) {
        return;
      }
      const maxScroll = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const clamped = Math.min(restoreTarget, maxScroll);
      window.scrollTo(0, clamped);
      restoreAttemptsRef.current += 1;
      const deadline = restoreDeadlineRef.current ?? Date.now();
      if (Date.now() < deadline) {
        restoreTimeoutRef.current = window.setTimeout(attemptRestore, 60);
        return;
      }
      stopRestore();
    };
    const raf = window.requestAnimationFrame(attemptRestore);
    restoreIntervalRef.current = window.setInterval(attemptRestore, 120);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", handleScroll);
      if (restoreTimeoutRef.current) {
        window.clearTimeout(restoreTimeoutRef.current);
        restoreTimeoutRef.current = null;
      }
      if (restoreIntervalRef.current) {
        window.clearInterval(restoreIntervalRef.current);
        restoreIntervalRef.current = null;
      }
    };
  }, [posts.length, restoreTarget]);

  useEffect(() => {
    if (!userId) {
      return;
    }
    if (!posts.length) {
      return;
    }
    const cacheToken = `${userId}:${timeRange || "all"}`;
    const cacheKey = `feed:cache:${cacheToken}`;
    const payload = JSON.stringify({
      posts,
      cursor,
      hasNext,
    });
    sessionStorage.setItem(cacheKey, payload);
  }, [cursor, hasNext, posts, timeRange, userId]);
}
