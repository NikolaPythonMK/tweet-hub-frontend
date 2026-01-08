"use client";

import type { ReactNode } from "react";
import styles from "../PostDetailView.module.css";

type PostDetailRepliesProps = {
  replyCount: number;
  children: ReactNode;
};

export default function PostDetailReplies({ replyCount, children }: PostDetailRepliesProps) {
  return (
    <section className={styles.replies}>
      <div className={styles.repliesHeader}>
        <h2>Replies</h2>
        <span>{replyCount}</span>
      </div>
      <div className={`${styles.replyList} ${styles.threadRail}`}>{children}</div>
    </section>
  );
}
