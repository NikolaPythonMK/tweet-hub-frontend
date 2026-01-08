"use client";

import type { PostView } from "@/lib/api/types";
import PostCard from "@/components/feed/PostCard";
import StatePanel from "@/components/state/StatePanel";
import styles from "../BookmarksView.module.css";

type BookmarksListProps = {
  posts: PostView[];
  loading: boolean;
  hasNext: boolean;
  observeLoadMore: (node: HTMLDivElement | null) => void;
  pending: Set<string>;
  onLike: (post: PostView) => void;
  onBookmark: (post: PostView) => void;
  onRepost: (post: PostView) => void;
};

export default function BookmarksList({
  posts,
  loading,
  hasNext,
  observeLoadMore,
  pending,
  onLike,
  onBookmark,
  onRepost,
}: BookmarksListProps) {
  if (loading && posts.length === 0) {
    return (
      <StatePanel
        variant="loading"
        title="Loading bookmarks"
        message="Finding your saved posts."
      />
    );
  }

  if (!posts.length) {
    return (
      <StatePanel
        variant="empty"
        title="No bookmarks yet"
        message="Save posts to revisit them here."
      />
    );
  }

  return (
    <>
      <div className={styles.list}>
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

      {(hasNext || loading) && (
        <div ref={observeLoadMore} className="loadMoreSentinel">
          {loading ? "Loading more bookmarks..." : "Scroll for more"}
        </div>
      )}
    </>
  );
}
