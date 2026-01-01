"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { listBookmarks } from "@/lib/api/bookmarks";
import { getErrorMessage } from "@/lib/api/client";
import {
  bookmarkPost,
  getPostView,
  likePost,
  repostPost,
  unbookmarkPost,
  unlikePost,
  unrepostPost,
} from "@/lib/api/posts";
import type { Bookmark, PostView } from "@/lib/api/types";
import { useSession } from "@/lib/auth/useSession";
import PostCard from "@/components/feed/PostCard";
import StatePanel from "@/components/state/StatePanel";
import styles from "./BookmarksView.module.css";

export default function BookmarksView() {
  const { user, loading: sessionLoading } = useSession();
  const [posts, setPosts] = useState<PostView[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<Set<string>>(new Set());

  const updatePost = useCallback(
    (id: string, updater: (post: PostView) => PostView) => {
      setPosts((prev) => prev.map((post) => (post.id === id ? updater(post) : post)));
    },
    [],
  );

  const runAction = useCallback(async (key: string, action: () => Promise<void>) => {
    setPending((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    setError("");
    try {
      await action();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPending((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }, []);

  const hydrateBookmarks = useCallback(async (items: Bookmark[]): Promise<PostView[]> => {
    if (!items.length) return [];
    const results = await Promise.allSettled(
      items.map((bookmark) => getPostView(bookmark.postId)),
    );
    return results
      .map((result) => (result.status === "fulfilled" ? result.value : null))
      .filter((post): post is PostView => !!post);
  }, []);

  const loadBookmarks = useCallback(
    async (reset: boolean, cursorOverride?: string | null) => {
      setLoading(true);
      setError("");
      try {
        const nextCursor = reset ? undefined : cursorOverride ?? undefined;
        const response = await listBookmarks({ limit: 10, cursor: nextCursor });
        const hydrated = await hydrateBookmarks(response.items);
        setPosts((prev) => (reset ? hydrated : [...prev, ...hydrated]));
        setCursor(response.nextCursor ?? null);
        setHasNext(response.hasNext);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [hydrateBookmarks],
  );

  useEffect(() => {
    if (sessionLoading) return;
    if (!user) return;
    setPosts([]);
    setCursor(null);
    setHasNext(false);
    void loadBookmarks(true, null);
  }, [loadBookmarks, sessionLoading, user]);

  const toggleLike = useCallback(
    (target: PostView) =>
      runAction(`like:${target.id}`, async () => {
        if (target.likedByMe) {
          await unlikePost(target.id);
          updatePost(target.id, (current) => ({
            ...current,
            likedByMe: false,
            likeCount: Math.max(0, current.likeCount - 1),
          }));
        } else {
          await likePost(target.id);
          updatePost(target.id, (current) => ({
            ...current,
            likedByMe: true,
            likeCount: current.likeCount + 1,
          }));
        }
      }),
    [runAction, updatePost],
  );

  const toggleBookmark = useCallback(
    (target: PostView) =>
      runAction(`bookmark:${target.id}`, async () => {
        if (target.bookmarkedByMe) {
          await unbookmarkPost(target.id);
          setPosts((prev) => prev.filter((post) => post.id !== target.id));
        } else {
          await bookmarkPost(target.id);
          updatePost(target.id, (current) => ({
            ...current,
            bookmarkedByMe: true,
          }));
        }
      }),
    [runAction, updatePost],
  );

  const toggleRepost = useCallback(
    (target: PostView) =>
      runAction(`repost:${target.id}`, async () => {
        if (target.repostedByMe) {
          await unrepostPost(target.id);
          updatePost(target.id, (current) => ({
            ...current,
            repostedByMe: false,
            repostCount: Math.max(0, current.repostCount - 1),
          }));
        } else {
          await repostPost(target.id);
          updatePost(target.id, (current) => ({
            ...current,
            repostedByMe: true,
            repostCount: current.repostCount + 1,
          }));
        }
      }),
    [runAction, updatePost],
  );

  const emptyState = useMemo(() => {
    if (loading && posts.length === 0) {
      return {
        variant: "loading" as const,
        title: "Loading bookmarks",
        message: "Finding your saved posts.",
      };
    }
    if (!posts.length) {
      return {
        variant: "empty" as const,
        title: "No bookmarks yet",
        message: "Save posts to revisit them here.",
      };
    }
    return null;
  }, [loading, posts.length]);

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
      <header className={styles.nav}>
        <Link href="/feed" className={styles.back}>
          <- Back to feed
        </Link>
        <div className={styles.navMeta}>Bookmarks</div>
      </header>

      {error && (
        <StatePanel variant="error" title="Unable to load bookmarks" message={error} />
      )}

      {emptyState ? (
        <StatePanel
          variant={emptyState.variant}
          title={emptyState.title}
          message={emptyState.message}
        />
      ) : (
        <div className={styles.list}>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={toggleLike}
              onBookmark={toggleBookmark}
              onRepost={toggleRepost}
              pending={{
                like: pending.has(`like:${post.id}`),
                bookmark: pending.has(`bookmark:${post.id}`),
                repost: pending.has(`repost:${post.id}`),
              }}
            />
          ))}
        </div>
      )}

      {hasNext && (
        <button
          className={styles.loadMore}
          onClick={() => loadBookmarks(false, cursor)}
          disabled={loading}
        >
          {loading ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
}
