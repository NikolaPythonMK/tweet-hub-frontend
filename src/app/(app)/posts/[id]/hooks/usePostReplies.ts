"use client";

import { useCallback, useState } from "react";
import { listFeed, listPosts } from "@/lib/api/posts";
import { getErrorMessage } from "@/lib/api/client";
import type { PostView } from "@/lib/api/types";
import { useInfiniteScroll } from "@/lib/hooks/useInfiniteScroll";
import { withEmptyFlags } from "./postView";

type UsePostRepliesOptions = {
  isAuthed: boolean;
  onError: (message: string) => void;
  onStart?: () => void;
};

export function usePostReplies({
  isAuthed,
  onError,
  onStart,
}: UsePostRepliesOptions) {
  const [childrenByParent, setChildrenByParent] = useState<
    Record<string, PostView[]>
  >({});
  const [collapsedByParent, setCollapsedByParent] = useState<
    Record<string, boolean>
  >({});
  const [cursorByParent, setCursorByParent] = useState<
    Record<string, string | null>
  >({});
  const [hasNextByParent, setHasNextByParent] = useState<
    Record<string, boolean>
  >({});
  const [loadingByParent, setLoadingByParent] = useState<
    Record<string, boolean>
  >({});

  const resetReplies = useCallback(() => {
    setChildrenByParent({});
    setCollapsedByParent({});
    setCursorByParent({});
    setHasNextByParent({});
    setLoadingByParent({});
  }, []);

  const addReply = useCallback((parentId: string, reply: PostView) => {
    setChildrenByParent((prev) => ({
      ...prev,
      [parentId]: [reply, ...(prev[parentId] ?? [])],
    }));
    setCollapsedByParent((prev) => ({ ...prev, [parentId]: false }));
  }, []);

  const setCollapsed = useCallback((parentId: string, collapsed: boolean) => {
    setCollapsedByParent((prev) => ({ ...prev, [parentId]: collapsed }));
  }, []);

  const loadChildren = useCallback(
    async (parentId: string, reset: boolean, cursorArg?: string | null) => {
      setLoadingByParent((prev) => ({ ...prev, [parentId]: true }));
      onStart?.();
      try {
        const cursor = reset ? undefined : cursorArg ?? undefined;
        if (isAuthed) {
          const response = await listFeed({
            replyToPostId: parentId,
            limit: 10,
            cursor,
          });
          setChildrenByParent((prev) => ({
            ...prev,
            [parentId]: reset
              ? response.items
              : [...(prev[parentId] ?? []), ...response.items],
          }));
          setCursorByParent((prev) => ({
            ...prev,
            [parentId]: response.nextCursor ?? null,
          }));
          setHasNextByParent((prev) => ({
            ...prev,
            [parentId]: response.hasNext,
          }));
        } else {
          const response = await listPosts({
            replyToPostId: parentId,
            limit: 10,
            cursor,
          });
          const mapped = response.items.map((item) => withEmptyFlags(item));
          setChildrenByParent((prev) => ({
            ...prev,
            [parentId]: reset ? mapped : [...(prev[parentId] ?? []), ...mapped],
          }));
          setCursorByParent((prev) => ({
            ...prev,
            [parentId]: response.nextCursor ?? null,
          }));
          setHasNextByParent((prev) => ({
            ...prev,
            [parentId]: response.hasNext,
          }));
        }
      } catch (err) {
        onError(getErrorMessage(err));
      } finally {
        setLoadingByParent((prev) => ({ ...prev, [parentId]: false }));
      }
    },
    [isAuthed, onError, onStart],
  );

  const observeLoadMore = useInfiniteScroll<HTMLDivElement>({
    enabled: true,
    deps: [cursorByParent, hasNextByParent, loadingByParent, childrenByParent],
    onIntersect: (target) => {
      const parentId = target.dataset.parentId;
      if (!parentId) {
        return;
      }
      const isLoading = loadingByParent[parentId] ?? false;
      const hasNext = hasNextByParent[parentId] ?? false;
      if (!hasNext || isLoading) {
        return;
      }
      void loadChildren(parentId, false, cursorByParent[parentId] ?? null);
    },
  });

  const registerLoadMoreRef = useCallback(
    (parentId: string) => (node: HTMLDivElement | null) => {
      if (node) {
        node.dataset.parentId = parentId;
      }
      observeLoadMore(node);
    },
    [observeLoadMore],
  );

  return {
    childrenByParent,
    collapsedByParent,
    cursorByParent,
    hasNextByParent,
    loadingByParent,
    setChildrenByParent,
    setCollapsedByParent,
    addReply,
    setCollapsed,
    resetReplies,
    loadChildren,
    registerLoadMoreRef,
  };
}
