"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/useSession";
import StatePanel from "@/components/state/StatePanel";
import styles from "./page.module.css";

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useSession();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/feed");
    }
  }, [loading, router, user]);

  if (loading) {
    return (
      <StatePanel
        size="page"
        variant="loading"
        title="Checking your session"
        message="Taking you to the right place."
      />
    );
  }

  if (user) {
    return (
      <StatePanel
        size="page"
        variant="loading"
        title="Heading to your feed"
        message="Loading your timeline."
      />
    );
  }

  return (
    <div className={styles.page}>
      <main className={styles.hero}>
        <div className={styles.heroCopy}>
          <h1 className={styles.title}>
            A quieter feed for real thoughts, built for momentum.
          </h1>
          <p className={styles.lede}>
            Tweet Hub keeps the essentials: fast posting, crisp threads, and
            intentional visibility. Start small, stay sharp, and keep your
            timeline centered.
          </p>
          <div className={styles.heroActions}>
            <Link href="/register" className={styles.primary}>
              Start a profile
            </Link>
            <Link href="/feed" className={styles.secondary}>
              Explore feed
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
