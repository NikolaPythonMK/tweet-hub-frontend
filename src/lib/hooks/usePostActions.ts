"use client";

import { useCallback } from "react";
import type { PostView } from "@/lib/api/types";
import {
  bookmarkPost,
  likePost,
  repostPost,
  unbookmarkPost,
  unlikePost,
  unrepostPost,
} from "@/lib/api/posts";

type UsePostActionsOptions = {
  runAction: (key: string, action: () => Promise<void>) => Promise<void>;
  updatePost: (id: string, updater: (post: PostView) => PostView) => void;
  removePost?: (id: string) => void;
  removeOnUnbookmark?: boolean;
};

export function usePostActions({
  runAction,
  updatePost,
  removePost,
  removeOnUnbookmark = false,
}: UsePostActionsOptions) {
  const toggleLike = useCallback(
    (post: PostView) =>
      runAction(`like:${post.id}`, async () => {
        if (post.likedByMe) {
          await unlikePost(post.id);
          updatePost(post.id, (current) => ({
            ...current,
            likedByMe: false,
            likeCount: Math.max(0, current.likeCount - 1),
          }));
        } else {
          await likePost(post.id);
          updatePost(post.id, (current) => ({
            ...current,
            likedByMe: true,
            likeCount: current.likeCount + 1,
          }));
        }
      }),
    [runAction, updatePost],
  );

  const toggleBookmark = useCallback(
    (post: PostView) =>
      runAction(`bookmark:${post.id}`, async () => {
        if (post.bookmarkedByMe) {
          await unbookmarkPost(post.id);
          if (removeOnUnbookmark && removePost) {
            removePost(post.id);
            return;
          }
          updatePost(post.id, (current) => ({
            ...current,
            bookmarkedByMe: false,
          }));
        } else {
          await bookmarkPost(post.id);
          updatePost(post.id, (current) => ({
            ...current,
            bookmarkedByMe: true,
          }));
        }
      }),
    [removeOnUnbookmark, removePost, runAction, updatePost],
  );

  const toggleRepost = useCallback(
    (post: PostView) =>
      runAction(`repost:${post.id}`, async () => {
        if (post.repostedByMe) {
          await unrepostPost(post.id);
          updatePost(post.id, (current) => ({
            ...current,
            repostedByMe: false,
            repostCount: Math.max(0, current.repostCount - 1),
          }));
        } else {
          await repostPost(post.id);
          updatePost(post.id, (current) => ({
            ...current,
            repostedByMe: true,
            repostCount: current.repostCount + 1,
          }));
        }
      }),
    [runAction, updatePost],
  );

  return { toggleLike, toggleBookmark, toggleRepost };
}
