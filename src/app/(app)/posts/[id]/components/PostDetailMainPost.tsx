"use client";

import type { PostView } from "@/lib/api/types";
import PostCard from "@/components/feed/PostCard";
import styles from "../PostDetailView.module.css";

type PostDetailMainPostProps = {
  post: PostView;
  isAuthed: boolean;
  pending: Set<string>;
  onLike: (post: PostView) => void;
  onBookmark: (post: PostView) => void;
  onRepost: (post: PostView) => void;
};

export default function PostDetailMainPost({
  post,
  isAuthed,
  pending,
  onLike,
  onBookmark,
  onRepost,
}: PostDetailMainPostProps) {
  return (
    <div className={styles.threadRail}>
      <PostCard
        post={post}
        variant="thread"
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
    </div>
  );
}
