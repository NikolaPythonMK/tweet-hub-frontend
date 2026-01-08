"use client";

import { useCallback } from "react";
import { listBookmarks } from "@/lib/api/bookmarks";
import { getPostView } from "@/lib/api/posts";
import type { Bookmark, PostView } from "@/lib/api/types";
import { useCursorList } from "@/lib/hooks/useCursorList";

type UseBookmarksListOptions = {
  userId?: string;
  sessionLoading: boolean;
  onError?: (error: unknown) => void;
  onStart?: () => void;
};

export function useBookmarksList({
  userId,
  sessionLoading,
  onError,
  onStart,
}: UseBookmarksListOptions) {
  const hydrateBookmarks = useCallback(async (items: Bookmark[]): Promise<PostView[]> => {
    if (!items.length) return [];
    const results = await Promise.allSettled(
      items.map((bookmark) => getPostView(bookmark.postId)),
    );
    return results
      .map((result) => (result.status === "fulfilled" ? result.value : null))
      .filter((post): post is PostView => !!post);
  }, []);

  const fetchBookmarks = useCallback(
    async (cursor?: string | null) => {
      const response = await listBookmarks({
        limit: 10,
        cursor: cursor ?? undefined,
      });
      const hydrated = await hydrateBookmarks(response.items);
      return {
        items: hydrated,
        nextCursor: response.nextCursor ?? null,
        hasNext: response.hasNext,
      };
    },
    [hydrateBookmarks],
  );

  const {
    items: posts,
    setItems: setPosts,
    hasNext,
    loading,
    loadMore,
  } = useCursorList<PostView>({
    enabled: !!userId && !sessionLoading,
    fetchPage: fetchBookmarks,
    deps: [userId],
    onError,
    onStart,
  });

  return {
    posts,
    setPosts,
    hasNext,
    loading,
    loadMore,
  };
}
