"use client";

import BackToFeedHeader from "@/components/nav/BackToFeedHeader";
import styles from "../NotificationsView.module.css";

type NotificationsHeaderProps = {
  title: string;
};

export default function NotificationsHeader({ title }: NotificationsHeaderProps) {
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
