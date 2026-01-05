"use client";

import type { ReactNode } from "react";
import styles from "./PostListHeader.module.css";

type PostListHeaderProps = {
  title?: string;
  right?: ReactNode;
};

export default function PostListHeader({ title, right }: PostListHeaderProps) {
  return (
    <div className={styles.header}>
      {title ? <h2 className={styles.title}>{title}</h2> : <span />}
      <div className={styles.right}>{right}</div>
    </div>
  );
}
