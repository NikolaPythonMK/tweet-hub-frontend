"use client";

import { useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import { getErrorMessage } from "@/lib/api/client";
import type { PostVisibility, ReplyPolicy } from "@/lib/api/types";
import { useSession } from "@/lib/auth/useSession";
import { useInfiniteScroll } from "@/lib/hooks/useInfiniteScroll";
import { usePendingActions } from "@/lib/hooks/usePendingActions";
import { useSyncSessionUserPosts } from "@/lib/hooks/useSyncSessionUserPosts";
import { usePostActions } from "@/lib/hooks/usePostActions";
import PostListHeader from "@/components/posts/PostListHeader";
import PostTimeRangeFilter from "@/components/posts/PostTimeRangeFilter";
import StatePanel from "@/components/state/StatePanel";
import { useFeedComposer } from "./hooks/useFeedComposer";
import { useFeedPosts } from "./hooks/useFeedPosts";
import { useFeedScrollCache } from "./hooks/useFeedScrollCache";
import FeedGuest from "./components/FeedGuest";
import FeedList from "./components/FeedList";
import FeedComposer from "./components/FeedComposer";
import FeedSidebar from "./components/FeedSidebar";
import styles from "./FeedView.module.css";

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

export default function FeedView() {
  const { user, loading } = useSession();
  const pathname = usePathname();
  const [error, setError] = useState("");

  const handleActionError = useCallback(
    (err: unknown) => setError(getErrorMessage(err)),
    [setError],
  );
  const handleActionStart = useCallback(() => setError(""), [setError]);

  const { pending, runAction } = usePendingActions({
    onError: handleActionError,
    onStart: handleActionStart,
  });

  const {
    posts,
    setPosts,
    cursor,
    setCursor,
    hasNext,
    setHasNext,
    loadingPosts,
    loadPosts,
    updatePost,
    timeRange,
    setTimeRange,
  } = useFeedPosts({
    onError: handleActionError,
    onStart: handleActionStart,
  });

  useFeedScrollCache({
    userId: user?.id ?? null,
    pathname,
    timeRange,
    posts,
    cursor,
    hasNext,
    setPosts,
    setCursor,
    setHasNext,
    loadPosts,
  });

  const { toggleLike, toggleBookmark, toggleRepost } = usePostActions({
    runAction,
    updatePost,
  });

  const {
    draft,
    setDraft,
    imagePreview,
    visibility,
    setVisibility,
    replyPolicy,
    setReplyPolicy,
    posting,
    canSubmit,
    handleImageChange,
    clearImage,
    submitPost,
  } = useFeedComposer({
    user,
    onPostCreated: (post) => setPosts((prev) => [post, ...prev]),
    setError,
  });

  useSyncSessionUserPosts(user, setPosts);

  const observeLoadMore = useInfiniteScroll<HTMLDivElement>({
    enabled: !!user && hasNext && !loadingPosts,
    deps: [cursor, hasNext, loadingPosts],
    onIntersect: () => {
      void loadPosts(false, cursor);
    },
  });

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
    return <FeedGuest />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <FeedSidebar user={user} postCount={posts.length} />

        <main className={styles.feed}>
          <PostListHeader
            right={
              <PostTimeRangeFilter
                value={timeRange}
                onChange={setTimeRange}
                label="Sort"
              />
            }
          />
          <FeedComposer
            draft={draft}
            onDraftChange={setDraft}
            imagePreview={imagePreview}
            onImageChange={handleImageChange}
            onClearImage={clearImage}
            visibility={visibility}
            onVisibilityChange={setVisibility}
            replyPolicy={replyPolicy}
            onReplyPolicyChange={setReplyPolicy}
            posting={posting}
            canSubmit={canSubmit}
            onSubmit={submitPost}
            visibilityOptions={visibilityOptions}
            replyPolicyOptions={replyPolicyOptions}
          />

          {error && (
            <StatePanel
              variant="error"
              title="Unable to load feed"
              message={error}
            />
          )}

          <FeedList
            posts={posts}
            loadingPosts={loadingPosts}
            hasNext={hasNext}
            observeLoadMore={observeLoadMore}
            pending={pending}
            onLike={toggleLike}
            onBookmark={toggleBookmark}
            onRepost={toggleRepost}
          />
        </main>

        <aside className={styles.rightRail} />
      </div>
    </div>
  );
}
