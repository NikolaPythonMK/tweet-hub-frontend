"use client";

import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { PostView, User } from "@/lib/api/types";
import { applyUserToPosts } from "@/lib/posts/session-user";

export function useSyncSessionUserPosts(
  user: User | null,
  setPosts: Dispatch<SetStateAction<PostView[]>>,
) {
  useEffect(() => {
    if (!user) {
      return;
    }
    setPosts((prev) => applyUserToPosts(prev, user));
  }, [setPosts, user?.avatarUrl, user?.displayName, user?.id, user?.username]);
}
