"use client";

import BackToFeedHeader from "@/components/nav/BackToFeedHeader";
import styles from "../BookmarksView.module.css";

type BookmarksHeaderProps = {
  title?: string;
};

export default function BookmarksHeader({ title = "Bookmarks" }: BookmarksHeaderProps) {
  return (
    <BackToFeedHeader
      className={styles.nav}
      backClassName={styles.back}
      metaClassName={styles.navMeta}
    >
      {title}
    </BackToFeedHeader>
  );
}
