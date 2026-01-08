"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getPost, getPostView } from "@/lib/api/posts";
import { getErrorMessage } from "@/lib/api/client";
import type { PostView } from "@/lib/api/types";
import { withEmptyFlags } from "./postView";

type UsePostThreadOptions = {
  postId: string;
  isAuthed: boolean;
  userId?: string;
  sessionLoading: boolean;
  setPost: (post: PostView | null) => void;
  onError: (message: string) => void;
  onStart?: () => void;
  onBeforeLoad?: () => void;
};

export function usePostThread({
  postId,
  isAuthed,
  userId,
  sessionLoading,
  setPost,
  onError,
  onStart,
  onBeforeLoad,
}: UsePostThreadOptions) {
  const [loadingPost, setLoadingPost] = useState(true);
  const loadKeyRef = useRef<string | null>(null);

  const loadPost = useCallback(async () => {
    setLoadingPost(true);
    onStart?.();
    try {
      if (isAuthed) {
        const response = await getPostView(postId);
        setPost(response);
      } else {
        const response = await getPost(postId);
        setPost(response ? withEmptyFlags(response) : null);
      }
    } catch (err) {
      onError(getErrorMessage(err));
      setPost(null);
    } finally {
      setLoadingPost(false);
    }
  }, [isAuthed, onError, onStart, postId, setPost]);

  useEffect(() => {
    if (sessionLoading) {
      return;
    }
    const loadKey = `${postId}:${isAuthed ? userId ?? "auth" : "anon"}`;
    if (loadKeyRef.current === loadKey) {
      return;
    }
    loadKeyRef.current = loadKey;
    window.scrollTo(0, 0);
    onBeforeLoad?.();
    void loadPost();
  }, [isAuthed, loadPost, onBeforeLoad, postId, sessionLoading, userId]);

  return { loadingPost, loadPost };
}
