"use client";

import type { UserStats } from "@/lib/api/types";
import styles from "../ProfileView.module.css";

type ProfileStatsProps = {
  stats: UserStats | null;
};

export default function ProfileStats({ stats }: ProfileStatsProps) {
  return (
    <section className={styles.stats}>
      <div className={styles.statCard}>
        <span>Posts</span>
        <strong>{stats?.postCount ?? 0}</strong>
      </div>
      <div className={styles.statCard}>
        <span>Followers</span>
        <strong>{stats?.followerCount ?? 0}</strong>
      </div>
      <div className={styles.statCard}>
        <span>Following</span>
        <strong>{stats?.followingCount ?? 0}</strong>
      </div>
    </section>
  );
}
