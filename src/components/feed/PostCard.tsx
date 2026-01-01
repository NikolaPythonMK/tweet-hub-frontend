"use client";

import type { PostView } from "@/lib/api/types";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import styles from "./PostCard.module.css";

type PostCardProps = {
  post: PostView;
  onLike?: (post: PostView) => void;
  onBookmark?: (post: PostView) => void;
  onRepost?: (post: PostView) => void;
  onReply?: (post: PostView) => void;
  pending?: {
    like?: boolean;
    bookmark?: boolean;
    repost?: boolean;
  };
  showActions?: boolean;
};

export default function PostCard({
  post,
  onLike,
  onBookmark,
  onRepost,
  onReply,
  pending,
  showActions = true,
}: PostCardProps) {
  const handle = post.authorId.slice(0, 8);
  const initials = handle.slice(0, 2).toUpperCase();
  const likeLabel = post.likedByMe ? "Liked" : "Like";
  const bookmarkLabel = post.bookmarkedByMe ? "Bookmarked" : "Bookmark";
  const repostLabel = post.repostedByMe ? "Reposted" : "Repost";
  const canInteract = showActions && onLike && onBookmark && onRepost;
  const canReply = showActions && onReply;

  return (
    <article className={styles.card}>
      <div className={styles.avatar}>{initials}</div>
      <div className={styles.content}>
        <div className={styles.meta}>
          <Link className={styles.handle} href={`/users/${post.authorId}`}>
            @{handle}
          </Link>
          <span className={styles.dot} />
          <time className={styles.time}>{formatDate(post.createdAt)}</time>
        </div>
        {post.replyToPostId && (
          <div className={styles.replyContext}>
            <span>Replying to</span>
            <Link href={`/posts/${post.replyToPostId}`}>post</Link>
          </div>
        )}
        {post.text && <p className={styles.text}>{post.text}</p>}
        {post.imageUrl && (
          <div className={styles.media}>
            <div className={styles.mediaPlaceholder}>
              <span>image</span>
            </div>
          </div>
        )}
        {post.quoteOfPostId && (
          <div className={styles.quoteContext}>
            <span>Quoted post</span>
            <Link href={`/posts/${post.quoteOfPostId}`}>View</Link>
          </div>
        )}
        {canInteract && (
          <div className={styles.actions}>
            <button
              type="button"
              className={`${styles.actionButton} ${post.likedByMe ? styles.active : ""}`}
              onClick={() => onLike(post)}
              disabled={pending?.like}
              aria-pressed={post.likedByMe}
            >
              <span>{post.likeCount}</span>
              <span>{likeLabel}</span>
            </button>
            <button
              type="button"
              className={`${styles.actionButton} ${post.repostedByMe ? styles.active : ""}`}
              onClick={() => onRepost(post)}
              disabled={pending?.repost}
              aria-pressed={post.repostedByMe}
            >
              <span>{post.repostCount}</span>
              <span>{repostLabel}</span>
            </button>
            <button
              type="button"
              className={`${styles.actionButton} ${post.bookmarkedByMe ? styles.active : ""}`}
              onClick={() => onBookmark(post)}
              disabled={pending?.bookmark}
              aria-pressed={post.bookmarkedByMe}
            >
              <span>{bookmarkLabel}</span>
            </button>
            {canReply && (
              <button
                type="button"
                className={styles.actionButton}
                onClick={() => onReply?.(post)}
              >
                <span>Reply</span>
              </button>
            )}
          </div>
        )}
        <div className={styles.stats}>
          <span>replies {post.replyCount}</span>
          <span>views {post.viewCount}</span>
          <Link className={styles.threadLink} href={`/posts/${post.id}`}>
            Open thread
          </Link>
        </div>
      </div>
    </article>
  );
}
