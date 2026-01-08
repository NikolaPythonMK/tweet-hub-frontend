"use client";

import styles from "../NotificationsView.module.css";

export type NotificationsFilterKey = "all" | "unread";

type NotificationsFiltersProps = {
  filter: NotificationsFilterKey;
  onChange: (filter: NotificationsFilterKey) => void;
};

export default function NotificationsFilters({
  filter,
  onChange,
}: NotificationsFiltersProps) {
  return (
    <div className={styles.filters}>
      <button
        type="button"
        className={`${styles.filterButton} ${filter === "all" ? styles.activeFilter : ""}`}
        onClick={() => onChange("all")}
      >
        All
      </button>
      <button
        type="button"
        className={`${styles.filterButton} ${
          filter === "unread" ? styles.activeFilter : ""
        }`}
        onClick={() => onChange("unread")}
      >
        Unread
      </button>
    </div>
  );
}
