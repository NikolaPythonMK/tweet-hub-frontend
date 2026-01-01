"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import {
  bookmarkPost,
  createPost,
  likePost,
  listFeed,
  repostPost,
  unbookmarkPost,
  unlikePost,
  unrepostPost,
} from "@/lib/api/posts";
import { getErrorMessage } from "@/lib/api/client";
import type { PostView } from "@/lib/api/types";
import { useSession } from "@/lib/auth/useSession";
import PostCard from "@/components/feed/PostCard";
import StatePanel from "@/components/state/StatePanel";
import styles from "./FeedView.module.css";

export default function FeedView() {
  const { user, loading } = useSession();
  const [posts, setPosts] = useState<PostView[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [draft, setDraft] = useState("");
  const canSubmit = draft.trim().length > 0;
  const [error, setError] = useState("");
  const [pending, setPending] = useState<Set<string>>(new Set());

  const updatePost = useCallback(
    (id: string, updater: (post: PostView) => PostView) => {
      setPosts((prev) => prev.map((post) => (post.id === id ? updater(post) : post)));
    },
    [],
  );

  const runAction = useCallback(
    async (key: string, action: () => Promise<void>) => {
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
    },
    [],
  );

  const loadPosts = useCallback(async (reset: boolean) => {
    setLoadingPosts(true);
    setError("");
    try {
      const response = await listFeed({
        limit: 10,
        cursor: reset ? undefined : cursor ?? undefined,
      });
      setPosts((prev) => (reset ? response.items : [...prev, ...response.items]));
      setCursor(response.nextCursor ?? null);
      setHasNext(response.hasNext);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingPosts(false);
    }
  }, [cursor]);

  useEffect(() => {
    if (!user) {
      return;
    }
    void loadPosts(true);
  }, [user, loadPosts]);

  const submitPost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.trim()) {
      return;
    }
    setError("");
    try {
      const created = await createPost({ text: draft.trim() });
      const withFlags: PostView = {
        ...created,
        likedByMe: false,
        bookmarkedByMe: false,
        repostedByMe: false,
      };
      setPosts((prev) => [withFlags, ...prev]);
      setDraft("");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

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
    [runAction, updatePost],
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

  if (loading) {
    return (
      <StatePanel
        size="page"
        variant="loading"
        title="Loading your feed"
        message="Pulling in the latest posts."
      />
    );
  }

  if (!user) {
    return (
      <div className={styles.guest}>
        <div className={styles.guestCard}>
          <h1>Sign in to shape your feed.</h1>
          <p>
            Log in to post, reply, and build the timeline around your
            conversations.
          </p>
          <div className={styles.guestActions}>
            <Link href="/login" className={styles.primary}>
              Log in
            </Link>
            <Link href="/register" className={styles.secondary}>
              Create account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.profileCard}>
            <div className={styles.avatarLarge}>
              {user.displayName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className={styles.name}>{user.displayName}</div>
              <div className={styles.handle}>@{user.username}</div>
            </div>
            <div className={styles.profileMeta}>
              <span>{posts.length} posts</span>
              <span>focus feed</span>
            </div>
          </div>
          <div className={styles.sideNote}>
            <h4>Visibility rules</h4>
            <p>Keep replies on track by picking who can respond.</p>
          </div>
        </aside>

        <main className={styles.feed}>
          <form className={styles.composer} onSubmit={submitPost}>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Share a short thought..."
              maxLength={280}
            />
            <div className={styles.composerFooter}>
              <span>{draft.trim().length}/280</span>
              <button type="submit" disabled={!canSubmit}>
                Post
              </button>
            </div>
          </form>

          {error && (
            <StatePanel
              variant="error"
              title="Unable to load feed"
              message={error}
            />
          )}

          <div className={styles.feedList}>
            {posts.length === 0 && !loadingPosts && (
              <StatePanel
                variant="empty"
                title="No posts yet"
                message="Start the thread with your first post."
              />
            )}
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

          {hasNext && (
            <button
              className={styles.loadMore}
              onClick={() => loadPosts(false)}
              disabled={loadingPosts}
            >
              {loadingPosts ? "Loading..." : "Load more"}
            </button>
          )}
        </main>

        <aside className={styles.rightRail}>
          <div className={styles.trendCard}>
            <h4>Trending now</h4>
            <ul>
              <li>
                <span>#ships</span>
                <span>1.2k posts</span>
              </li>
              <li>
                <span>#buildinpublic</span>
                <span>860 posts</span>
              </li>
              <li>
                <span>#slowtech</span>
                <span>410 posts</span>
              </li>
            </ul>
          </div>
          <div className={styles.trendCard}>
            <h4>Next up</h4>
            <p>Invite two people to unlock private circles.</p>
            <button className={styles.secondary}>Invite a friend</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
