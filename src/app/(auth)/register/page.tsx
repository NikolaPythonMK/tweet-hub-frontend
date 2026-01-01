import Link from "next/link";
import AuthForm from "@/components/auth/AuthForm";
import styles from "../auth.module.css";

export default function RegisterPage() {
  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.side}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandMark} />
            <span>Tweet Hub</span>
          </Link>
          <h2>Start a focused feed in minutes.</h2>
          <p>
            Build a profile that keeps your posts sharp and your conversations
            intentional.
          </p>
          <div className={styles.highlights}>
            <div className={styles.highlightCard}>
              <span>Visibility</span>
              <h4>Choose who can reply to your posts.</h4>
            </div>
            <div className={styles.highlightCard}>
              <span>Momentum</span>
              <h4>Keep replies in the same thread, every time.</h4>
            </div>
          </div>
        </div>
        <div className={styles.formWrap}>
          <AuthForm mode="register" />
        </div>
      </div>
    </div>
  );
}
