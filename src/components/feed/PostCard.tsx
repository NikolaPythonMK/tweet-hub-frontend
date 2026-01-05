"use client";

import type { MouseEvent } from "react";
import type { PostView } from "@/lib/api/types";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bookmark, Heart, MessageCircle, Repeat2 } from "lucide-react";
import { formatDate } from "@/lib/format";
import styles from "./PostCard.module.css";

type PostCardProps = {
  post: PostView;
  variant?: "default" | "thread";
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
  variant = "default",
  onLike,
  onBookmark,
  onRepost,
  onReply,
  pending,
  showActions = true,
}: PostCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const authorSlug = post.authorUsername ?? post.authorId;
  const handle = post.authorUsername ?? post.authorId.slice(0, 8);
  const displayName = post.authorDisplayName ?? handle;
  const initialsSource = displayName;
  const initials = initialsSource.slice(0, 2).toUpperCase();
  const avatarSrc = post.authorAvatarUrl
    ? post.authorAvatarUrl.startsWith("/")
      ? `/api${post.authorAvatarUrl}`
      : post.authorAvatarUrl
    : null;
  const likeLabel = post.likedByMe ? "Liked" : "Like";
  const bookmarkLabel = post.bookmarkedByMe ? "Bookmarked" : "Bookmark";
  const repostLabel = post.repostedByMe ? "Reposted" : "Repost";
  const canInteract = showActions && onLike && onBookmark && onRepost;
  const canReply = showActions && onReply;
  const visibilityLabel =
    post.visibility === "PUBLIC"
      ? null
      : post.visibility === "FOLLOWERS"
        ? "Followers only"
        : "Private";
  const replyLabel =
    post.replyPolicy === "EVERYONE"
      ? null
      : post.replyPolicy === "FOLLOWERS"
        ? "Replies: Followers"
        : "Replies: Nobody";
  const imageSrc = post.imageUrl
    ? post.imageUrl.startsWith("/")
      ? `/api${post.imageUrl}`
      : post.imageUrl
    : null;
  const repost = post.repost ?? null;
  const repostHandle = repost
    ? repost.authorUsername ?? repost.authorId.slice(0, 8)
    : "";
  const repostDisplayName = repost ? repost.authorDisplayName ?? repostHandle : "";
  const repostImageSrc = repost?.imageUrl
    ? repost.imageUrl.startsWith("/")
      ? `/api${repost.imageUrl}`
      : repost.imageUrl
    : null;

  const handleCardClick = (event: MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("a, button, input, textarea, select, label")) {
      return;
    }
    router.push(`/posts/${post.id}`);
  };

  const saveFeedScroll = () => {
    if (pathname !== "/feed") {
      return;
    }
    sessionStorage.setItem("feed:restore", "1");
    sessionStorage.setItem("feed:scrollY", String(window.scrollY));
    sessionStorage.setItem("feed:viewBumpId", post.id);
  };

  const cardClassName =
    variant === "thread" ? `${styles.card} ${styles.threadCard}` : styles.card;

  return (
    <article
      className={cardClassName}
      onPointerDown={saveFeedScroll}
      onClick={handleCardClick}
    >
      <Link
        href={`/users/${encodeURIComponent(authorSlug)}`}
        className={styles.avatar}
        aria-label={`View ${displayName}'s profile`}
      >
        {avatarSrc ? (
          <img src={avatarSrc} alt="" className={styles.avatarImage} />
        ) : (
          initials
        )}
      </Link>
      <div className={styles.content}>
        <div className={styles.meta}>
          <Link
            className={styles.displayName}
            href={`/users/${encodeURIComponent(authorSlug)}`}
          >
            {displayName}
          </Link>
          <Link className={styles.handle} href={`/users/${encodeURIComponent(authorSlug)}`}>
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
        {(visibilityLabel || replyLabel) && (
          <div className={styles.badges}>
            {visibilityLabel && <span className={styles.badge}>{visibilityLabel}</span>}
            {replyLabel && <span className={styles.badge}>{replyLabel}</span>}
          </div>
        )}
        {post.text && <p className={styles.text}>{post.text}</p>}
        {repost && (
          <div className={styles.repostBlock}>
            <div className={styles.repostMeta}>
              <span className={styles.repostLabel}>Reposted</span>
              <span className={styles.repostName}>{repostDisplayName}</span>
              <Link
                className={styles.repostHandle}
                href={`/users/${encodeURIComponent(repost.authorUsername ?? repost.authorId)}`}
              >
                @{repostHandle}
              </Link>
              <span className={styles.dot} />
              <time className={styles.time}>{formatDate(repost.createdAt)}</time>
            </div>
            {repost.text && <p className={styles.repostText}>{repost.text}</p>}
            {repostImageSrc && (
              <div className={styles.repostMedia}>
                <img src={repostImageSrc} alt="" loading="lazy" />
              </div>
            )}
            <Link className={styles.repostLink} href={`/posts/${repost.id}`}>
              View original
            </Link>
          </div>
        )}
        {post.quoteOfPostId && (
          <div className={styles.quoteContext}>
            <span>Quoted post</span>
            <Link href={`/posts/${post.quoteOfPostId}`}>View</Link>
          </div>
        )}
        {post.imageUrl && (
          <div className={styles.media}>
            {imageSrc && <img src={imageSrc} alt="" loading="lazy" />}
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
              aria-label={likeLabel}
            >
              <Heart className={styles.actionIcon} aria-hidden="true" />
              <span className={styles.actionCount}>{post.likeCount}</span>
              <span className="sr-only">{likeLabel}</span>
            </button>
            <button
              type="button"
              className={`${styles.actionButton} ${post.repostedByMe ? styles.active : ""}`}
              onClick={() => onRepost(post)}
              disabled={pending?.repost}
              aria-pressed={post.repostedByMe}
              aria-label={repostLabel}
            >
              <Repeat2 className={styles.actionIcon} aria-hidden="true" />
              <span className={styles.actionCount}>{post.repostCount}</span>
              <span className="sr-only">{repostLabel}</span>
            </button>
            <button
              type="button"
              className={`${styles.actionButton} ${post.bookmarkedByMe ? styles.active : ""}`}
              onClick={() => onBookmark(post)}
              disabled={pending?.bookmark}
              aria-pressed={post.bookmarkedByMe}
              aria-label={bookmarkLabel}
            >
              <Bookmark className={styles.actionIcon} aria-hidden="true" />
              <span className="sr-only">{bookmarkLabel}</span>
            </button>
            {canReply && (
              <button
                type="button"
                className={styles.actionButton}
                onClick={() => onReply?.(post)}
                aria-label="Reply"
              >
                <MessageCircle className={styles.actionIcon} aria-hidden="true" />
                <span className="sr-only">Reply</span>
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
