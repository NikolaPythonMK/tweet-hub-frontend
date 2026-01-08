"use client";

import Link from "next/link";
import styles from "../FeedView.module.css";

export default function FeedGuest() {
  return (
    <div className={styles.guest}>
      <div className={styles.guestCard}>
        <h1>Sign in to shape your feed.</h1>
        <p>
          Log in to post, reply, and build the timeline around your
          conversations.
        </p>
        <div className={styles.guestActions}>
          <Link href="/login" className={styles.primary}>
            Log in
          </Link>
          <Link href="/register" className={styles.secondary}>
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
