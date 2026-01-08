"use client";

import { useCallback, useState } from "react";
import type { Post, PostTimeRange, PostView } from "@/lib/api/types";
import { listFeed, listPosts } from "@/lib/api/posts";
import { useCursorList } from "@/lib/hooks/useCursorList";
import { usePostActions } from "@/lib/hooks/usePostActions";

type UseProfilePostsOptions = {
  profileId: string | null;
  isAuthed: boolean;
  sessionLoading: boolean;
  runAction: (key: string, action: () => Promise<void>) => Promise<void>;
  onError?: (error: unknown) => void;
  onStart?: () => void;
};

const emptyFlags = (post: Post): PostView => ({
  ...post,
  likedByMe: false,
  bookmarkedByMe: false,
  repostedByMe: false,
});

export function useProfilePosts({
  profileId,
  isAuthed,
  sessionLoading,
  runAction,
  onError,
  onStart,
}: UseProfilePostsOptions) {
  const [timeRange, setTimeRange] = useState<PostTimeRange | "">("");

  const fetchPosts = useCallback(
    async (cursor?: string | null) => {
      if (!profileId) {
        return { items: [], nextCursor: null, hasNext: false };
      }
      const nextCursor = cursor ?? undefined;
      if (isAuthed) {
        const response = await listFeed({
          authorId: profileId,
          limit: 10,
          cursor: nextCursor,
          timeRange: timeRange || undefined,
        });
        return {
          items: response.items,
          nextCursor: response.nextCursor ?? null,
          hasNext: response.hasNext,
        };
      }
      const response = await listPosts({
        authorId: profileId,
        limit: 10,
        cursor: nextCursor,
        timeRange: timeRange || undefined,
      });
      return {
        items: response.items.map((item) => emptyFlags(item)),
        nextCursor: response.nextCursor ?? null,
        hasNext: response.hasNext,
      };
    },
    [isAuthed, profileId, timeRange],
  );

  const {
    items: posts,
    setItems: setPosts,
    hasNext: postsHasNext,
    loading: loadingPosts,
    loadMore: loadMorePosts,
  } = useCursorList<PostView>({
    enabled: !!profileId && !sessionLoading,
    fetchPage: fetchPosts,
    deps: [profileId, isAuthed, timeRange],
    onError,
    onStart,
  });

  const updatePost = useCallback(
    (id: string, updater: (post: PostView) => PostView) => {
      setPosts((prev) => prev.map((post) => (post.id === id ? updater(post) : post)));
    },
    [setPosts],
  );

  const { toggleLike, toggleBookmark, toggleRepost } = usePostActions({
    runAction,
    updatePost,
  });

  return {
    posts,
    loadingPosts,
    postsHasNext,
    loadMorePosts,
    timeRange,
    setTimeRange,
    toggleLike,
    toggleBookmark,
    toggleRepost,
  };
}
