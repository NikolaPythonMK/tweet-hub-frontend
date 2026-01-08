"use client";

import styles from "../ProfileView.module.css";

export type ProfileTabKey = "posts" | "followers" | "following";

type ProfileTabsProps = {
  tab: ProfileTabKey;
  onTabChange: (tab: ProfileTabKey) => void;
};

export default function ProfileTabs({ tab, onTabChange }: ProfileTabsProps) {
  return (
    <div className={styles.tabs}>
      <button
        type="button"
        className={`${styles.tabButton} ${tab === "posts" ? styles.activeTab : ""}`}
        onClick={() => onTabChange("posts")}
      >
        Posts
      </button>
      <button
        type="button"
        className={`${styles.tabButton} ${tab === "followers" ? styles.activeTab : ""}`}
        onClick={() => onTabChange("followers")}
      >
        Followers
      </button>
      <button
        type="button"
        className={`${styles.tabButton} ${tab === "following" ? styles.activeTab : ""}`}
        onClick={() => onTabChange("following")}
      >
        Following
      </button>
    </div>
  );
}
