"use client";

import { useId } from "react";
import type { PostTimeRange } from "@/lib/api/types";
import { postTimeRangeOptions } from "@/lib/posts/post-time-range";
import styles from "./PostTimeRangeFilter.module.css";

type PostTimeRangeFilterProps = {
  value: PostTimeRange | "";
  onChange: (value: PostTimeRange | "") => void;
  label?: string;
};

export default function PostTimeRangeFilter({
  value,
  onChange,
  label = "Time range",
}: PostTimeRangeFilterProps) {
  const selectId = useId();

  return (
    <div className={styles.wrapper}>
      <label className={styles.label} htmlFor={selectId}>
        {label}
      </label>
      <select
        id={selectId}
        className={styles.select}
        value={value}
        onChange={(event) => onChange(event.target.value as PostTimeRange | "")}
      >
        <option value="">All time</option>
        {postTimeRangeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
