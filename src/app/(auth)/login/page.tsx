import AuthForm from "@/components/auth/AuthForm";
import styles from "../auth.module.css";

export default function LoginPage() {
  return (
    <div className={styles.page}>
      <div className={styles.formWrap}>
        <AuthForm mode="login" />
      </div>
    </div>
  );
}
