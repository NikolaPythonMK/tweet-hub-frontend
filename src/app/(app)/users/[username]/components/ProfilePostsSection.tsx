"use client";

import type { PostTimeRange, PostView } from "@/lib/api/types";
import PostCard from "@/components/feed/PostCard";
import PostListHeader from "@/components/posts/PostListHeader";
import PostTimeRangeFilter from "@/components/posts/PostTimeRangeFilter";
import StatePanel from "@/components/state/StatePanel";
import styles from "../ProfileView.module.css";

type ProfilePostsSectionProps = {
  posts: PostView[];
  loadingPosts: boolean;
  postsHasNext: boolean;
  observePostsLoadMore: (node: HTMLDivElement | null) => void;
  timeRange: PostTimeRange | "";
  onTimeRangeChange: (value: PostTimeRange | "") => void;
  isAuthed: boolean;
  pending: Set<string>;
  onLike: (post: PostView) => void;
  onBookmark: (post: PostView) => void;
  onRepost: (post: PostView) => void;
};

export default function ProfilePostsSection({
  posts,
  loadingPosts,
  postsHasNext,
  observePostsLoadMore,
  timeRange,
  onTimeRangeChange,
  isAuthed,
  pending,
  onLike,
  onBookmark,
  onRepost,
}: ProfilePostsSectionProps) {
  return (
    <section className={styles.listSection}>
      <PostListHeader
        right={<PostTimeRangeFilter value={timeRange} onChange={onTimeRangeChange} label="Sort" />}
      />
      {posts.length === 0 && !loadingPosts && (
        <StatePanel
          variant="empty"
          title="No posts yet"
          message="Share the first post to get the timeline moving."
        />
      )}
      <div className={styles.postList}>
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onLike={isAuthed ? onLike : undefined}
            onBookmark={isAuthed ? onBookmark : undefined}
            onRepost={isAuthed ? onRepost : undefined}
            pending={{
              like: pending.has(`like:${post.id}`),
              bookmark: pending.has(`bookmark:${post.id}`),
              repost: pending.has(`repost:${post.id}`),
            }}
            showActions={isAuthed}
          />
        ))}
      </div>
      {(postsHasNext || loadingPosts) && posts.length > 0 && (
        <div ref={observePostsLoadMore} className="loadMoreSentinel">
          {loadingPosts ? "Loading more posts..." : "Scroll for more"}
        </div>
      )}
    </section>
  );
}
