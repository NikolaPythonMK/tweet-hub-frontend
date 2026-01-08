"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { getErrorMessage } from "@/lib/api/client";
import type { PostView } from "@/lib/api/types";
import { useSession } from "@/lib/auth/useSession";
import { useInfiniteScroll } from "@/lib/hooks/useInfiniteScroll";
import { usePendingActions } from "@/lib/hooks/usePendingActions";
import { usePostActions } from "@/lib/hooks/usePostActions";
import StatePanel from "@/components/state/StatePanel";
import BookmarksHeader from "./components/BookmarksHeader";
import BookmarksList from "./components/BookmarksList";
import { useBookmarksList } from "./hooks/useBookmarksList";
import styles from "./BookmarksView.module.css";

export default function BookmarksView() {
  const { user, loading: sessionLoading } = useSession();
  const [error, setError] = useState("");
  const { pending, runAction } = usePendingActions({
    onError: (err) => setError(getErrorMessage(err)),
    onStart: () => setError(""),
  });

  const { posts, setPosts, hasNext, loading, loadMore } = useBookmarksList({
    userId: user?.id,
    sessionLoading,
    onError: (err) => setError(getErrorMessage(err)),
    onStart: () => setError(""),
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
    removePost: (id) => setPosts((prev) => prev.filter((post) => post.id !== id)),
    removeOnUnbookmark: true,
  });

  const observeLoadMore = useInfiniteScroll<HTMLDivElement>({
    enabled: !!user && hasNext && !loading,
    deps: [hasNext, loading, posts.length],
    onIntersect: () => {
      void loadMore();
    },
  });

  if (sessionLoading) {
    return (
      <StatePanel
        size="page"
        variant="loading"
        title="Checking your session"
        message="Hang tight while we verify your login."
      />
    );
  }

  if (!user) {
    return (
      <StatePanel
        size="page"
        variant="info"
        title="Log in to view bookmarks"
        message="Save posts on the feed to build your list."
        actions={
          <>
            <Link href="/login" data-variant="primary">
              Log in
            </Link>
            <Link href="/register">Create account</Link>
          </>
        }
      />
    );
  }

  return (
    <div className={styles.page}>
      <BookmarksHeader />

      {error && (
        <StatePanel variant="error" title="Unable to load bookmarks" message={error} />
      )}

      <BookmarksList
        posts={posts}
        loading={loading}
        hasNext={hasNext}
        observeLoadMore={observeLoadMore}
        pending={pending}
        onLike={toggleLike}
        onBookmark={toggleBookmark}
        onRepost={toggleRepost}
      />
    </div>
  );
}
