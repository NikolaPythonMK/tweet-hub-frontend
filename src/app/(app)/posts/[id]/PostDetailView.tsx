"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  bookmarkPost,
  createPost,
  getPost,
  getPostView,
  likePost,
  listFeed,
  listPosts,
  repostPost,
  unbookmarkPost,
  unlikePost,
  unrepostPost,
} from "@/lib/api/posts";
import { getErrorMessage } from "@/lib/api/client";
import type { Post, PostView } from "@/lib/api/types";
import { useSession } from "@/lib/auth/useSession";
import PostCard from "@/components/feed/PostCard";
import StatePanel from "@/components/state/StatePanel";
import styles from "./PostDetailView.module.css";

type PostDetailViewProps = {
  postId: string;
};

const emptyFlags = (post: Post): PostView => ({
  ...post,
  likedByMe: false,
  bookmarkedByMe: false,
  repostedByMe: false,
});

export default function PostDetailView({ postId }: PostDetailViewProps) {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const [post, setPost] = useState<PostView | null>(null);
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
  const [loadingPost, setLoadingPost] = useState(true);
  const [replyDraft, setReplyDraft] = useState("");
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [quoteDraft, setQuoteDraft] = useState("");
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<Set<string>>(new Set());
  const composerRef = useRef<HTMLFormElement | null>(null);

  const isAuthed = !!user;
  const canReply = isAuthed && replyDraft.trim().length > 0;
  const replyTarget = replyTargetId ?? postId;
  const replyLabel =
    replyTarget === postId
      ? "Replying to thread"
      : `Replying to ${replyTarget.slice(0, 8)}`;

  const updatePost = useCallback(
    (id: string, updater: (item: PostView) => PostView) => {
      setPost((prev) => (prev && prev.id === id ? updater(prev) : prev));
      setChildrenByParent((prev) => {
        const next: Record<string, PostView[]> = {};
        for (const [parentId, items] of Object.entries(prev)) {
          next[parentId] = items.map((item) => (item.id === id ? updater(item) : item));
        }
        return next;
      });
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

  const loadPost = useCallback(async () => {
    setLoadingPost(true);
    setError("");
    try {
      if (isAuthed) {
        const response = await getPostView(postId);
        setPost(response);
      } else {
        const response = await getPost(postId);
        setPost(response ? emptyFlags(response) : null);
      }
    } catch (err) {
      setError(getErrorMessage(err));
      setPost(null);
    } finally {
      setLoadingPost(false);
    }
  }, [isAuthed, postId]);

  const loadChildren = useCallback(
    async (parentId: string, reset: boolean) => {
      setLoadingByParent((prev) => ({ ...prev, [parentId]: true }));
      setError("");
      try {
        const cursor = reset ? undefined : cursorByParent[parentId] ?? undefined;
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
          const mapped = response.items.map((item) => emptyFlags(item));
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
        setError(getErrorMessage(err));
      } finally {
        setLoadingByParent((prev) => ({ ...prev, [parentId]: false }));
      }
    },
    [cursorByParent, isAuthed],
  );

  useEffect(() => {
    setReplyTargetId(postId);
    setChildrenByParent({});
    setCollapsedByParent({});
    setCursorByParent({});
    setHasNextByParent({});
    setLoadingByParent({});
    setQuoteOpen(false);
    setQuoteDraft("");
    if (sessionLoading) {
      return;
    }
    void loadPost();
    void loadChildren(postId, true);
  }, [loadChildren, loadPost, postId, sessionLoading]);

  const submitReply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canReply) {
      return;
    }
    setError("");
    try {
      const created = await createPost({
        text: replyDraft.trim(),
        replyToPostId: replyTarget,
      });
      const mapped = emptyFlags(created);
      setChildrenByParent((prev) => ({
        ...prev,
        [replyTarget]: [mapped, ...(prev[replyTarget] ?? [])],
      }));
      setCollapsedByParent((prev) => ({ ...prev, [replyTarget]: false }));
      setReplyDraft("");
      setReplyTargetId(postId);
      setPost((prev) =>
        prev ? { ...prev, replyCount: prev.replyCount + 1 } : prev,
      );
      if (replyTarget !== postId) {
        updatePost(replyTarget, (current) => ({
          ...current,
          replyCount: current.replyCount + 1,
        }));
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const submitQuote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAuthed || quoteLoading) {
      return;
    }
    setQuoteLoading(true);
    setError("");
    try {
      const trimmed = quoteDraft.trim();
      const created = await createPost({
        quoteOfPostId: postId,
        text: trimmed.length > 0 ? trimmed : undefined,
      });
      setQuoteDraft("");
      setQuoteOpen(false);
      router.push(`/posts/${created.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setQuoteLoading(false);
    }
  };

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
          updatePost(target.id, (current) => ({
            ...current,
            bookmarkedByMe: false,
          }));
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

  const handleReplyTo = useCallback((target: PostView) => {
    setReplyTargetId(target.id);
    composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const renderReplies = useCallback(
    (parentId: string, depth: number) => {
      const children = childrenByParent[parentId] ?? [];
      const isLoading = loadingByParent[parentId] ?? false;
      const hasNext = hasNextByParent[parentId] ?? false;
      const hasLoaded = Object.prototype.hasOwnProperty.call(
        childrenByParent,
        parentId,
      );

      return (
        <div className={styles.replyGroup}>
          {children.map((reply) => {
            const childLoaded = Object.prototype.hasOwnProperty.call(
              childrenByParent,
              reply.id,
            );
            const childHasNext = hasNextByParent[reply.id] ?? false;
            const childLoading = loadingByParent[reply.id] ?? false;
            const childCount = childrenByParent[reply.id]?.length ?? 0;
            const childCollapsed = collapsedByParent[reply.id] ?? false;

            return (
              <div
                key={reply.id}
                className={styles.replyNode}
                style={{ marginLeft: `${depth * 18}px` }}
              >
                <PostCard
                  post={reply}
                  onLike={isAuthed ? toggleLike : undefined}
                  onBookmark={isAuthed ? toggleBookmark : undefined}
                  onRepost={isAuthed ? toggleRepost : undefined}
                  onReply={isAuthed ? handleReplyTo : undefined}
                  pending={{
                    like: pending.has(`like:${reply.id}`),
                    bookmark: pending.has(`bookmark:${reply.id}`),
                    repost: pending.has(`repost:${reply.id}`),
                  }}
                  showActions={isAuthed}
                />
                {reply.replyCount > 0 && !childLoaded && (
                  <button
                    className={styles.showReplies}
                    type="button"
                    onClick={() => {
                      setCollapsedByParent((prev) => ({
                        ...prev,
                        [reply.id]: false,
                      }));
                      void loadChildren(reply.id, true);
                    }}
                    disabled={childLoading}
                  >
                    {childLoading
                      ? "Loading replies..."
                      : `View replies (${reply.replyCount})`}
                  </button>
                )}
                {childLoaded && childCount > 0 && (
                  <button
                    className={styles.collapseButton}
                    type="button"
                    onClick={() =>
                      setCollapsedByParent((prev) => ({
                        ...prev,
                        [reply.id]: !childCollapsed,
                      }))
                    }
                  >
                    {childCollapsed ? "Show replies" : "Hide replies"}
                  </button>
                )}
                {childLoaded && childCount === 0 && reply.replyCount > 0 && (
                  <div className={styles.emptyReplies}>No replies yet.</div>
                )}
                {childLoaded && !childCollapsed && renderReplies(reply.id, depth + 1)}
                {childLoaded && !childCollapsed && childHasNext && (
                  <button
                    className={styles.loadMore}
                    onClick={() => loadChildren(reply.id, false)}
                    disabled={childLoading}
                  >
                    {childLoading ? "Loading..." : "Load more replies"}
                  </button>
                )}
              </div>
            );
          })}
          {parentId === postId && hasLoaded && children.length === 0 && !isLoading && (
            <div className={styles.emptyReplies}>No replies yet.</div>
          )}
          {parentId === postId && hasNext && (
            <button
              className={styles.loadMore}
              onClick={() => loadChildren(parentId, false)}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Load more replies"}
            </button>
          )}
        </div>
      );
    },
    [
      childrenByParent,
      handleReplyTo,
      hasNextByParent,
      isAuthed,
      loadChildren,
      loadingByParent,
      pending,
      postId,
      toggleBookmark,
      toggleLike,
      toggleRepost,
    ],
  );

  const emptyState = useMemo(() => {
    if (loadingPost) {
      return {
        variant: "loading" as const,
        title: "Loading post",
        message: "Fetching the thread details.",
      };
    }
    if (!post) {
      return {
        variant: "empty" as const,
        title: "Post not found",
        message: "The thread may have been removed or does not exist.",
      };
    }
    return null;
  }, [loadingPost, post]);

  return (
    <div className={styles.page}>
      <header className={styles.nav}>
        <Link href="/feed" className={styles.back}>
          <- Back to feed
        </Link>
        <div className={styles.navMeta}>
          <span>Thread</span>
          <span className={styles.dot} />
          <span>{post?.replyCount ?? 0} replies</span>
        </div>
      </header>

      {emptyState ? (
        <StatePanel
          size="page"
          variant={emptyState.variant}
          title={emptyState.title}
          message={emptyState.message}
        />
      ) : (
        post && (
          <PostCard
            post={post}
            onLike={isAuthed ? toggleLike : undefined}
            onBookmark={isAuthed ? toggleBookmark : undefined}
            onRepost={isAuthed ? toggleRepost : undefined}
            pending={{
              like: pending.has(`like:${post.id}`),
              bookmark: pending.has(`bookmark:${post.id}`),
              repost: pending.has(`repost:${post.id}`),
            }}
            showActions={isAuthed}
          />
        )
      )}

      {!isAuthed && (
        <div className={styles.notice}>
          <p>Sign in to reply and interact with this thread.</p>
          <div className={styles.noticeActions}>
            <Link href="/login">Log in</Link>
            <Link href="/register">Create account</Link>
          </div>
        </div>
      )}

      {isAuthed && post && (
        <div className={styles.composeStack}>
          <div className={styles.quoteBlock}>
            <button
              type="button"
              className={styles.quoteToggle}
              onClick={() => setQuoteOpen((prev) => !prev)}
            >
              {quoteOpen ? "Cancel quote" : "Quote this post"}
            </button>
            {quoteOpen && (
              <form className={styles.quoteForm} onSubmit={submitQuote}>
                <textarea
                  value={quoteDraft}
                  onChange={(event) => setQuoteDraft(event.target.value)}
                  placeholder="Add a comment (optional)"
                  maxLength={280}
                />
                <div className={styles.composerFooter}>
                  <span>{quoteDraft.trim().length}/280</span>
                  <button type="submit" disabled={quoteLoading}>
                    {quoteLoading ? "Posting..." : "Post quote"}
                  </button>
                </div>
              </form>
            )}
          </div>
          <form ref={composerRef} className={styles.composer} onSubmit={submitReply}>
            <div className={styles.replyMeta}>
              <span>{replyLabel}</span>
              {replyTarget !== postId && (
                <button type="button" onClick={() => setReplyTargetId(postId)}>
                  Reply to thread
                </button>
              )}
            </div>
            <textarea
              value={replyDraft}
              onChange={(event) => setReplyDraft(event.target.value)}
              placeholder="Write a reply..."
              maxLength={280}
            />
            <div className={styles.composerFooter}>
              <span>{replyDraft.trim().length}/280</span>
              <button type="submit" disabled={!canReply}>
                Reply
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <StatePanel variant="error" title="Action failed" message={error} />
      )}

      <section className={styles.replies}>
        <div className={styles.repliesHeader}>
          <h2>Replies</h2>
          <span>{post?.replyCount ?? 0}</span>
        </div>
        <div className={styles.replyList}>{renderReplies(postId, 0)}</div>
      </section>
    </div>
  );
}
