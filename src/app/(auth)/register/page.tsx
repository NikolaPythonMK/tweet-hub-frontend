import AuthForm from "@/components/auth/AuthForm";
import styles from "../auth.module.css";

export default function RegisterPage() {
  return (
    <div className={styles.page}>
      <div className={styles.formWrap}>
        <AuthForm mode="register" />
      </div>
    </div>
  );
}
