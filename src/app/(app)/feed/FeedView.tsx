"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import {
  bookmarkPost,
  createPost,
  likePost,
  listFeed,
  repostPost,
  uploadPostImage,
  unbookmarkPost,
  unlikePost,
  unrepostPost,
} from "@/lib/api/posts";
import { getErrorMessage } from "@/lib/api/client";
import type { PostView, PostVisibility, ReplyPolicy } from "@/lib/api/types";
import { useSession } from "@/lib/auth/useSession";
import PostCard from "@/components/feed/PostCard";
import StatePanel from "@/components/state/StatePanel";
import styles from "./FeedView.module.css";

const visibilityOptions: { value: PostVisibility; label: string }[] = [
  { value: "PUBLIC", label: "Public" },
  { value: "FOLLOWERS", label: "Followers" },
  { value: "PRIVATE", label: "Private" },
];

const replyPolicyOptions: { value: ReplyPolicy; label: string }[] = [
  { value: "EVERYONE", label: "Everyone" },
  { value: "FOLLOWERS", label: "Followers" },
  { value: "MENTIONED_ONLY", label: "Mentioned" },
  { value: "NOBODY", label: "Nobody" },
];

const maxImageSize = 5 * 1024 * 1024;

export default function FeedView() {
  const { user, loading } = useSession();
  const [posts, setPosts] = useState<PostView[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [draft, setDraft] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<PostVisibility>("PUBLIC");
  const [replyPolicy, setReplyPolicy] = useState<ReplyPolicy>("EVERYONE");
  const [posting, setPosting] = useState(false);
  const canSubmit = (draft.trim().length > 0 || imageFile) && !posting;
  const [error, setError] = useState("");
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [viewBumpId, setViewBumpId] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const restoreScrollRef = useRef<number | null>(null);
  const scrollSaveTicking = useRef(false);
  const cacheHydrated = useRef(false);

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

  const loadPosts = useCallback(async (reset: boolean, cursorOverride?: string | null) => {
    setLoadingPosts(true);
    setError("");
    try {
      const nextCursor = reset ? undefined : cursorOverride ?? undefined;
      const response = await listFeed({
        limit: 10,
        cursor: nextCursor,
      });
      setPosts((prev) => (reset ? response.items : [...prev, ...response.items]));
      setCursor(response.nextCursor ?? null);
      setHasNext(response.hasNext);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }
    const restoreKey = "feed:restore";
    const shouldRestore = sessionStorage.getItem(restoreKey) === "1";
    const cacheKey = `feed:cache:${user.id}`;
    if (shouldRestore) {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as {
            posts: PostView[];
            cursor: string | null;
            hasNext: boolean;
          };
          if (Array.isArray(parsed.posts)) {
            setPosts(parsed.posts);
            setCursor(parsed.cursor ?? null);
            setHasNext(parsed.hasNext ?? false);
            cacheHydrated.current = true;
          }
        } catch {
          sessionStorage.removeItem(cacheKey);
        }
      }
    }
    const stored = sessionStorage.getItem("feed:scrollY");
    if (shouldRestore && stored) {
      const value = Number(stored);
      if (!Number.isNaN(value)) {
        restoreScrollRef.current = value;
      }
    }
    setViewBumpId(sessionStorage.getItem("feed:viewBumpId"));
    if (!cacheHydrated.current) {
      void loadPosts(true, null);
    }
  }, [user, loadPosts]);

  useEffect(() => {
    if (!user) {
      return;
    }
    const handleScroll = () => {
      if (scrollSaveTicking.current) {
        return;
      }
      scrollSaveTicking.current = true;
      requestAnimationFrame(() => {
        sessionStorage.setItem("feed:scrollY", String(window.scrollY));
        scrollSaveTicking.current = false;
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [user]);

  useEffect(() => {
    const target = restoreScrollRef.current;
    if (target === null) {
      return;
    }
    requestAnimationFrame(() => {
      window.scrollTo(0, target);
      restoreScrollRef.current = null;
      sessionStorage.removeItem("feed:scrollY");
      sessionStorage.removeItem("feed:restore");
    });
  }, [posts.length]);

  useEffect(() => {
    if (!viewBumpId || posts.length === 0) {
      return;
    }
    const bumpViewCount = (value: PostView["viewCount"]) => {
      const raw = typeof value === "string" ? value : String(value ?? 0);
      try {
        return (BigInt(raw || "0") + 1n).toString();
      } catch {
        return String((Number(raw) || 0) + 1);
      }
    };
    setPosts((prev) =>
      prev.map((post) =>
        post.id === viewBumpId
          ? { ...post, viewCount: bumpViewCount(post.viewCount) }
          : post,
      ),
    );
    setViewBumpId(null);
    sessionStorage.removeItem("feed:viewBumpId");
  }, [posts.length, viewBumpId]);

  useEffect(() => {
    if (!user) {
      return;
    }
    if (!posts.length) {
      return;
    }
    const cacheKey = `feed:cache:${user.id}`;
    const payload = JSON.stringify({
      posts,
      cursor,
      hasNext,
    });
    sessionStorage.setItem(cacheKey, payload);
  }, [cursor, hasNext, posts, user]);

  useEffect(() => {
    if (!hasNext || loadingPosts) {
      return;
    }
    const node = loadMoreRef.current;
    if (!node) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry || !entry.isIntersecting) {
          return;
        }
        observer.unobserve(node);
        void loadPosts(false, cursor);
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [cursor, hasNext, loadPosts, loadingPosts]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [imageFile]);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setImageFile(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed.");
      event.target.value = "";
      setImageFile(null);
      return;
    }
    if (file.size > maxImageSize) {
      setError("Image must be 5MB or smaller.");
      event.target.value = "";
      setImageFile(null);
      return;
    }
    setError("");
    setImageFile(file);
  };

  const clearImage = () => {
    setImageFile(null);
  };

  const submitPost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.trim() && !imageFile) {
      return;
    }
    setError("");
    setPosting(true);
    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        const uploaded = await uploadPostImage(imageFile);
        imageUrl = uploaded.url;
      }
      const created = await createPost({
        text: draft.trim() || undefined,
        imageUrl,
        visibility,
        replyPolicy,
      });
      const withFlags: PostView = {
        ...created,
        likedByMe: false,
        bookmarkedByMe: false,
        repostedByMe: false,
        authorUsername: user.username,
        authorDisplayName: user.displayName,
        authorAvatarUrl: user.avatarUrl ?? null,
      };
      setPosts((prev) => [withFlags, ...prev]);
      setDraft("");
      setImageFile(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPosting(false);
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
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl.startsWith("/") ? `/api${user.avatarUrl}` : user.avatarUrl}
                  alt=""
                  className={styles.avatarImage}
                />
              ) : (
                user.displayName.slice(0, 2).toUpperCase()
              )}
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
            <div className={styles.composerControls}>
              <label className={styles.control}>
                <span>Visibility</span>
                <select
                  value={visibility}
                  onChange={(event) =>
                    setVisibility(event.target.value as PostVisibility)
                  }
                >
                  {visibilityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.control}>
                <span>Replies</span>
                <select
                  value={replyPolicy}
                  onChange={(event) =>
                    setReplyPolicy(event.target.value as ReplyPolicy)
                  }
                >
                  {replyPolicyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.control}>
                <span>Image</span>
                <input type="file" accept="image/*" onChange={handleImageChange} />
              </label>
            </div>
            {imagePreview && (
              <div className={styles.imagePreview}>
                <img src={imagePreview} alt="" />
                <button type="button" onClick={clearImage}>
                  Remove image
                </button>
              </div>
            )}
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Share a short thought..."
              maxLength={280}
            />
            <div className={styles.composerFooter}>
              <span>{draft.trim().length}/280</span>
              <button type="submit" disabled={!canSubmit}>
                {posting ? "Posting..." : "Post"}
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

          {(hasNext || loadingPosts) && (
            <div ref={loadMoreRef} className={styles.loadMoreSentinel}>
              {loadingPosts ? "Loading more posts..." : "Scroll for more"}
            </div>
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
