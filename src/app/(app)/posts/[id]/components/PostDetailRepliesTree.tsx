"use client";

import type { PostView } from "@/lib/api/types";
import PostCard from "@/components/feed/PostCard";
import styles from "../PostDetailView.module.css";

type PostDetailRepliesTreeProps = {
  postId: string;
  childrenByParent: Record<string, PostView[]>;
  collapsedByParent: Record<string, boolean>;
  hasNextByParent: Record<string, boolean>;
  loadingByParent: Record<string, boolean>;
  registerLoadMoreRef: (parentId: string) => (node: HTMLDivElement | null) => void;
  isAuthed: boolean;
  pending: Set<string>;
  onLike: (post: PostView) => void;
  onBookmark: (post: PostView) => void;
  onRepost: (post: PostView) => void;
  onReply?: (post: PostView) => void;
  onLoadReplies: (parentId: string, reset: boolean, cursor?: string | null) => void;
  onSetCollapsed: (parentId: string, collapsed: boolean) => void;
};

export default function PostDetailRepliesTree({
  postId,
  childrenByParent,
  collapsedByParent,
  hasNextByParent,
  loadingByParent,
  registerLoadMoreRef,
  isAuthed,
  pending,
  onLike,
  onBookmark,
  onRepost,
  onReply,
  onLoadReplies,
  onSetCollapsed,
}: PostDetailRepliesTreeProps) {
  const renderReplies = (parentId: string, depth: number) => {
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
                onLike={isAuthed ? onLike : undefined}
                onBookmark={isAuthed ? onBookmark : undefined}
                onRepost={isAuthed ? onRepost : undefined}
                onReply={isAuthed ? onReply : undefined}
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
                    onSetCollapsed(reply.id, false);
                    onLoadReplies(reply.id, true, null);
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
                  onClick={() => onSetCollapsed(reply.id, !childCollapsed)}
                >
                  {childCollapsed ? "Show replies" : "Hide replies"}
                </button>
              )}
              {childLoaded && childCount === 0 && reply.replyCount > 0 && (
                <div className={styles.emptyReplies}>No replies yet.</div>
              )}
              {childLoaded && !childCollapsed && renderReplies(reply.id, depth + 1)}
              {childLoaded && !childCollapsed && (childHasNext || childLoading) && (
                <div ref={registerLoadMoreRef(reply.id)} className="loadMoreSentinel">
                  {childLoading ? "Loading more replies..." : "Scroll for more replies"}
                </div>
              )}
            </div>
          );
        })}
        {parentId === postId && hasLoaded && children.length === 0 && !isLoading && (
          <div className={styles.emptyReplies}>No replies yet.</div>
        )}
        {parentId === postId && (hasNext || isLoading) && (
          <div ref={registerLoadMoreRef(parentId)} className="loadMoreSentinel">
            {isLoading ? "Loading more replies..." : "Scroll for more replies"}
          </div>
        )}
      </div>
    );
  };

  return renderReplies(postId, 0);
}
