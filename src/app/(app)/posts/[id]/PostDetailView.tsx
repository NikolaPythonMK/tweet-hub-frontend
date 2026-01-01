"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
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
  uploadPostImage,
  unbookmarkPost,
  unlikePost,
  unrepostPost,
} from "@/lib/api/posts";
import { getErrorMessage } from "@/lib/api/client";
import type { Post, PostView, PostVisibility, ReplyPolicy } from "@/lib/api/types";
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
  const [replyImageFile, setReplyImageFile] = useState<File | null>(null);
  const [replyImagePreview, setReplyImagePreview] = useState<string | null>(null);
  const [replyVisibility, setReplyVisibility] =
    useState<PostVisibility>("PUBLIC");
  const [replyPolicy, setReplyPolicy] = useState<ReplyPolicy>("EVERYONE");
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [quoteDraft, setQuoteDraft] = useState("");
  const [quoteImageFile, setQuoteImageFile] = useState<File | null>(null);
  const [quoteImagePreview, setQuoteImagePreview] = useState<string | null>(null);
  const [quoteVisibility, setQuoteVisibility] =
    useState<PostVisibility>("PUBLIC");
  const [quoteReplyPolicy, setQuoteReplyPolicy] =
    useState<ReplyPolicy>("EVERYONE");
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<Set<string>>(new Set());
  const composerRef = useRef<HTMLFormElement | null>(null);

  const isAuthed = !!user;
  const canReply = isAuthed && (replyDraft.trim().length > 0 || replyImageFile);
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
    async (parentId: string, reset: boolean, cursorArg?: string | null) => {
      setLoadingByParent((prev) => ({ ...prev, [parentId]: true }));
      setError("");
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
    [isAuthed],
  );

  useEffect(() => {
    window.scrollTo(0, 0);
    setReplyTargetId(postId);
    setChildrenByParent({});
    setCollapsedByParent({});
    setCursorByParent({});
    setHasNextByParent({});
    setLoadingByParent({});
    setQuoteOpen(false);
    setQuoteDraft("");
    setReplyImageFile(null);
    setQuoteImageFile(null);
    if (sessionLoading) {
      return;
    }
    void loadPost();
    void loadChildren(postId, true, null);
  }, [loadChildren, loadPost, postId, sessionLoading]);

  useEffect(() => {
    if (!replyImageFile) {
      setReplyImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(replyImageFile);
    setReplyImagePreview(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [replyImageFile]);

  useEffect(() => {
    if (!quoteImageFile) {
      setQuoteImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(quoteImageFile);
    setQuoteImagePreview(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [quoteImageFile]);

  const handleImageChange = (
    event: ChangeEvent<HTMLInputElement>,
    setFile: (file: File | null) => void,
  ) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setFile(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed.");
      event.target.value = "";
      setFile(null);
      return;
    }
    if (file.size > maxImageSize) {
      setError("Image must be 5MB or smaller.");
      event.target.value = "";
      setFile(null);
      return;
    }
    setError("");
    setFile(file);
  };

  const clearReplyImage = () => {
    setReplyImageFile(null);
  };

  const clearQuoteImage = () => {
    setQuoteImageFile(null);
  };

  const submitReply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canReply) {
      return;
    }
    setError("");
    try {
      let imageUrl: string | undefined;
      if (replyImageFile) {
        const uploaded = await uploadPostImage(replyImageFile);
        imageUrl = uploaded.url;
      }
      const created = await createPost({
        text: replyDraft.trim() || undefined,
        replyToPostId: replyTarget,
        imageUrl,
        visibility: replyVisibility,
        replyPolicy,
      });
      const mapped = {
        ...emptyFlags(created),
        authorUsername: user?.username ?? created.authorUsername,
        authorDisplayName: user?.displayName ?? created.authorDisplayName,
        authorAvatarUrl: user?.avatarUrl ?? created.authorAvatarUrl,
      };
      setChildrenByParent((prev) => ({
        ...prev,
        [replyTarget]: [mapped, ...(prev[replyTarget] ?? [])],
      }));
      setCollapsedByParent((prev) => ({ ...prev, [replyTarget]: false }));
      setReplyDraft("");
      setReplyImageFile(null);
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
      let imageUrl: string | undefined;
      if (quoteImageFile) {
        const uploaded = await uploadPostImage(quoteImageFile);
        imageUrl = uploaded.url;
      }
      const created = await createPost({
        quoteOfPostId: postId,
        text: trimmed.length > 0 ? trimmed : undefined,
        imageUrl,
        visibility: quoteVisibility,
        replyPolicy: quoteReplyPolicy,
      });
      setQuoteDraft("");
      setQuoteOpen(false);
      setQuoteImageFile(null);
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
                className={
                  depth > 0
                    ? `${styles.replyNode} ${styles.replyNested}`
                    : styles.replyNode
                }
                style={{ marginLeft: `${depth * 18}px` }}
              >
                <PostCard
                  post={reply}
                  variant="thread"
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
                      void loadChildren(reply.id, true, null);
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
                    onClick={() =>
                      loadChildren(reply.id, false, cursorByParent[reply.id] ?? null)
                    }
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
              onClick={() =>
                loadChildren(parentId, false, cursorByParent[parentId] ?? null)
              }
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
          {"<- Back to feed"}
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
          <div className={styles.threadRail}>
            <PostCard
              post={post}
              variant="thread"
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
          </div>
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
        <div
          className={`${styles.composeStack} ${styles.threadRail} ${styles.threadOffset}`}
        >
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
                <div className={styles.composerControls}>
                  <label className={styles.control}>
                    <span>Visibility</span>
                    <select
                      value={quoteVisibility}
                      onChange={(event) =>
                        setQuoteVisibility(event.target.value as PostVisibility)
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
                      value={quoteReplyPolicy}
                      onChange={(event) =>
                        setQuoteReplyPolicy(event.target.value as ReplyPolicy)
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
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) =>
                        handleImageChange(event, setQuoteImageFile)
                      }
                    />
                  </label>
                </div>
                {quoteImagePreview && (
                  <div className={styles.imagePreview}>
                    <img src={quoteImagePreview} alt="" />
                    <button type="button" onClick={clearQuoteImage}>
                      Remove image
                    </button>
                  </div>
                )}
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
            <div className={styles.composerControls}>
              <label className={styles.control}>
                <span>Visibility</span>
                <select
                  value={replyVisibility}
                  onChange={(event) =>
                    setReplyVisibility(event.target.value as PostVisibility)
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
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    handleImageChange(event, setReplyImageFile)
                  }
                />
              </label>
            </div>
            {replyImagePreview && (
              <div className={styles.imagePreview}>
                <img src={replyImagePreview} alt="" />
                <button type="button" onClick={clearReplyImage}>
                  Remove image
                </button>
              </div>
            )}
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
        <div className={`${styles.replyList} ${styles.threadRail}`}>
          {renderReplies(postId, 0)}
        </div>
      </section>
    </div>
  );
}
