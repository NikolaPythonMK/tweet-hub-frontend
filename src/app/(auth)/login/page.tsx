import Link from "next/link";
import AuthForm from "@/components/auth/AuthForm";
import styles from "../auth.module.css";

export default function LoginPage() {
  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.side}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandMark} />
            <span>Tweet Hub</span>
          </Link>
          <h2>Pick up the thread where you left it.</h2>
          <p>
            Log back in to keep your feed moving. Replies, likes, and follows
            stay ready for you.
          </p>
          <div className={styles.highlights}>
            <div className={styles.highlightCard}>
              <span>Live feed</span>
              <h4>Chronological posts, zero distractions.</h4>
            </div>
            <div className={styles.highlightCard}>
              <span>Bookmarks</span>
              <h4>Save the threads you want to revisit.</h4>
            </div>
          </div>
        </div>
        <div className={styles.formWrap}>
          <AuthForm mode="login" />
        </div>
      </div>
    </div>
  );
}
