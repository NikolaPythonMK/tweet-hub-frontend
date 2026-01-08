"use client";

import { useCallback, useState } from "react";
import { listFeed } from "@/lib/api/posts";
import type { PostTimeRange, PostView } from "@/lib/api/types";

type UseFeedPostsOptions = {
  onError?: (error: unknown) => void;
  onStart?: () => void;
};

export function useFeedPosts({ onError, onStart }: UseFeedPostsOptions) {
  const [posts, setPosts] = useState<PostView[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [timeRange, setTimeRange] = useState<PostTimeRange | "">("");

  const loadPosts = useCallback(
    async (reset: boolean, cursorOverride?: string | null) => {
      setLoadingPosts(true);
      onStart?.();
      try {
        const nextCursor = reset ? undefined : cursorOverride ?? undefined;
        const response = await listFeed({
          limit: 10,
          cursor: nextCursor,
          timeRange: timeRange || undefined,
        });
        setPosts((prev) => (reset ? response.items : [...prev, ...response.items]));
        setCursor(response.nextCursor ?? null);
        setHasNext(response.hasNext);
      } catch (err) {
        onError?.(err);
      } finally {
        setLoadingPosts(false);
      }
    },
    [onError, onStart, timeRange],
  );

  const updatePost = useCallback(
    (id: string, updater: (post: PostView) => PostView) => {
      setPosts((prev) => prev.map((post) => (post.id === id ? updater(post) : post)));
    },
    [],
  );

  return {
    posts,
    setPosts,
    cursor,
    setCursor,
    hasNext,
    setHasNext,
    loadingPosts,
    loadPosts,
    updatePost,
    timeRange,
    setTimeRange,
  };
}
