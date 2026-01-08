"use client";

import Link from "next/link";
import styles from "../PostDetailView.module.css";

export default function PostDetailAuthNotice() {
  return (
    <div className={styles.notice}>
      <p>Sign in to reply and interact with this thread.</p>
      <div className={styles.noticeActions}>
        <Link href="/login">Log in</Link>
        <Link href="/register">Create account</Link>
      </div>
    </div>
  );
}
