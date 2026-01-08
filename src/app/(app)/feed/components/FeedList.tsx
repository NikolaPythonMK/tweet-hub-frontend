"use client";

import type { PostView } from "@/lib/api/types";
import PostCard from "@/components/feed/PostCard";
import StatePanel from "@/components/state/StatePanel";
import styles from "../FeedView.module.css";

type FeedListProps = {
  posts: PostView[];
  loadingPosts: boolean;
  hasNext: boolean;
  observeLoadMore: (node: HTMLDivElement | null) => void;
  pending: Set<string>;
  onLike: (post: PostView) => void;
  onBookmark: (post: PostView) => void;
  onRepost: (post: PostView) => void;
};

export default function FeedList({
  posts,
  loadingPosts,
  hasNext,
  observeLoadMore,
  pending,
  onLike,
  onBookmark,
  onRepost,
}: FeedListProps) {
  return (
    <>
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
            onLike={onLike}
            onBookmark={onBookmark}
            onRepost={onRepost}
            pending={{
              like: pending.has(`like:${post.id}`),
              bookmark: pending.has(`bookmark:${post.id}`),
              repost: pending.has(`repost:${post.id}`),
            }}
          />
        ))}
      </div>

      {(hasNext || loadingPosts) && (
        <div ref={observeLoadMore} className="loadMoreSentinel">
          {loadingPosts ? "Loading more posts..." : "Scroll for more"}
        </div>
      )}
    </>
  );
}
