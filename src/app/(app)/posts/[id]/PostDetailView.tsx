"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getErrorMessage } from "@/lib/api/client";
import type { PostView, PostVisibility, ReplyPolicy } from "@/lib/api/types";
import { useSession } from "@/lib/auth/useSession";
import { usePendingActions } from "@/lib/hooks/usePendingActions";
import { usePostActions } from "@/lib/hooks/usePostActions";
import StatePanel from "@/components/state/StatePanel";
import PostDetailAuthNotice from "./components/PostDetailAuthNotice";
import PostDetailHeader from "./components/PostDetailHeader";
import PostDetailMainPost from "./components/PostDetailMainPost";
import PostDetailQuoteComposer from "./components/PostDetailQuoteComposer";
import PostDetailReplies from "./components/PostDetailReplies";
import PostDetailRepliesTree from "./components/PostDetailRepliesTree";
import PostDetailReplyComposer from "./components/PostDetailReplyComposer";
import { usePostComposers } from "./hooks/usePostComposers";
import { usePostReplies } from "./hooks/usePostReplies";
import { usePostThread } from "./hooks/usePostThread";
import styles from "./PostDetailView.module.css";

type PostDetailViewProps = {
  postId: string;
};

const visibilityOptions: { value: PostVisibility; label: string }[] = [
  { value: "PUBLIC", label: "Public" },
  { value: "FOLLOWERS", label: "Followers" },
  { value: "PRIVATE", label: "Private" },
];

const replyPolicyOptions: { value: ReplyPolicy; label: string }[] = [
  { value: "EVERYONE", label: "Everyone" },
  { value: "FOLLOWERS", label: "Followers" },
  { value: "NOBODY", label: "Nobody" },
];

export default function PostDetailView({ postId }: PostDetailViewProps) {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const [post, setPost] = useState<PostView | null>(null);
  const [error, setError] = useState("");
  const { pending, runAction } = usePendingActions({
    onError: (err) => setError(getErrorMessage(err)),
    onStart: () => setError(""),
  });
  const composerRef = useRef<HTMLFormElement | null>(null);

  const isAuthed = !!user;

  const {
    childrenByParent,
    collapsedByParent,
    hasNextByParent,
    loadingByParent,
    setChildrenByParent,
    addReply,
    setCollapsed,
    resetReplies,
    loadChildren,
    registerLoadMoreRef,
  } = usePostReplies({
    isAuthed,
    onError: (message) => setError(message),
    onStart: () => setError(""),
  });

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
    [setChildrenByParent],
  );

  const { toggleLike, toggleBookmark, toggleRepost } = usePostActions({
    runAction,
    updatePost,
  });

  const setPostUpdater = useCallback(
    (updater: (prev: PostView | null) => PostView | null) => {
      setPost((prev) => updater(prev));
    },
    [setPost],
  );

  const {
    replyDraft,
    setReplyDraft,
    replyImagePreview,
    replyVisibility,
    setReplyVisibility,
    replyPolicy,
    setReplyPolicy,
    replyTargetId,
    setReplyTargetId,
    replyLabel,
    canReply,
    quoteDraft,
    setQuoteDraft,
    quoteImagePreview,
    quoteVisibility,
    setQuoteVisibility,
    quoteReplyPolicy,
    setQuoteReplyPolicy,
    quoteOpen,
    setQuoteOpen,
    quoteLoading,
    handleReplyImageChange,
    handleQuoteImageChange,
    clearReplyImage,
    clearQuoteImage,
    submitReply,
    submitQuote,
    resetComposers,
  } = usePostComposers({
    postId,
    user,
    isAuthed,
    addReply,
    setPost: setPostUpdater,
    updatePost,
    onError: (message) => setError(message),
    onStart: () => setError(""),
    onQuoteCreated: (createdId) => router.push(`/posts/${createdId}`),
  });

  const handleThreadReset = useCallback(() => {
    resetReplies();
    resetComposers();
    void loadChildren(postId, true, null);
  }, [loadChildren, postId, resetComposers, resetReplies]);

  const { loadingPost } = usePostThread({
    postId,
    isAuthed,
    userId: user?.id,
    sessionLoading,
    setPost,
    onError: (message) => setError(message),
    onStart: () => setError(""),
    onBeforeLoad: handleThreadReset,
  });

  const handleReplyTo = useCallback(
    (target: PostView) => {
      setReplyTargetId(target.id);
      composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    },
    [setReplyTargetId],
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
      <PostDetailHeader replyCount={post?.replyCount ?? 0} />

      {emptyState ? (
        <StatePanel
          size="page"
          variant={emptyState.variant}
          title={emptyState.title}
          message={emptyState.message}
        />
      ) : (
        post && (
          <PostDetailMainPost
            post={post}
            isAuthed={isAuthed}
            pending={pending}
            onLike={toggleLike}
            onBookmark={toggleBookmark}
            onRepost={toggleRepost}
          />
        )
      )}

      {!isAuthed && <PostDetailAuthNotice />}

      {isAuthed && post && (
        <div
          className={`${styles.composeStack} ${styles.threadRail} ${styles.threadOffset}`}
        >
          <PostDetailQuoteComposer
            isOpen={quoteOpen}
            onToggle={() => setQuoteOpen((prev) => !prev)}
            quoteDraft={quoteDraft}
            onQuoteDraftChange={setQuoteDraft}
            quoteVisibility={quoteVisibility}
            onQuoteVisibilityChange={setQuoteVisibility}
            quoteReplyPolicy={quoteReplyPolicy}
            onQuoteReplyPolicyChange={setQuoteReplyPolicy}
            quoteImagePreview={quoteImagePreview}
            onQuoteImageChange={handleQuoteImageChange}
            onClearQuoteImage={clearQuoteImage}
            quoteLoading={quoteLoading}
            onSubmit={submitQuote}
            visibilityOptions={visibilityOptions}
            replyPolicyOptions={replyPolicyOptions}
          />
          <PostDetailReplyComposer
            composerRef={composerRef}
            replyLabel={replyLabel}
            showReplyToThread={replyTargetId !== postId}
            onReplyToThread={() => setReplyTargetId(postId)}
            replyVisibility={replyVisibility}
            onReplyVisibilityChange={setReplyVisibility}
            replyPolicy={replyPolicy}
            onReplyPolicyChange={setReplyPolicy}
            replyImagePreview={replyImagePreview}
            onReplyImageChange={handleReplyImageChange}
            onClearReplyImage={clearReplyImage}
            replyDraft={replyDraft}
            onReplyDraftChange={setReplyDraft}
            canReply={canReply}
            onSubmit={submitReply}
            visibilityOptions={visibilityOptions}
            replyPolicyOptions={replyPolicyOptions}
          />
        </div>
      )}

      {error && (
        <StatePanel variant="error" title="Action failed" message={error} />
      )}

      <PostDetailReplies replyCount={post?.replyCount ?? 0}>
        <PostDetailRepliesTree
          postId={postId}
          childrenByParent={childrenByParent}
          collapsedByParent={collapsedByParent}
          hasNextByParent={hasNextByParent}
          loadingByParent={loadingByParent}
          registerLoadMoreRef={registerLoadMoreRef}
          isAuthed={isAuthed}
          pending={pending}
          onLike={toggleLike}
          onBookmark={toggleBookmark}
          onRepost={toggleRepost}
          onReply={isAuthed ? handleReplyTo : undefined}
          onLoadReplies={loadChildren}
          onSetCollapsed={setCollapsed}
        />
      </PostDetailReplies>
    </div>
  );
}
