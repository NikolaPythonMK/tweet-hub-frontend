"use client";

import type { User } from "@/lib/api/types";
import { resolveMediaUrl } from "@/lib/media";
import styles from "../FeedView.module.css";

type FeedSidebarProps = {
  user: User;
  postCount: number;
};

export default function FeedSidebar({ user, postCount }: FeedSidebarProps) {
  const avatarSrc = resolveMediaUrl(user.avatarUrl);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.profileCard}>
        <div className={styles.avatarLarge}>
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt=""
              className={styles.avatarImage}
            />
          ) : (
            user.displayName.slice(0, 2).toUpperCase()
          )}
        </div>
        <div>
          <div className={styles.name}>{user.displayName}</div>
          <div className={styles.handle}>@{user.username}</div>
        </div>
        <div className={styles.profileMeta}>
          <span>{postCount} posts</span>
          <span>focus feed</span>
        </div>
      </div>
    </aside>
  );
}
