"use client";

import BackToFeedHeader from "@/components/nav/BackToFeedHeader";
import styles from "../PostDetailView.module.css";

type PostDetailHeaderProps = {
  replyCount: number;
};

export default function PostDetailHeader({ replyCount }: PostDetailHeaderProps) {
  return (
    <BackToFeedHeader
      className={styles.nav}
      backClassName={styles.back}
      metaClassName={styles.navMeta}
      scroll={false}
    >
      <span>Thread</span>
      <span className={styles.dot} />
      <span>{replyCount} replies</span>
    </BackToFeedHeader>
  );
}
