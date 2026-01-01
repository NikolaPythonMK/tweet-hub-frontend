import type { ReactNode } from "react";
import styles from "./StatePanel.module.css";

type StatePanelVariant = "loading" | "empty" | "error" | "info";
type StatePanelSize = "page" | "section";

type StatePanelProps = {
  title: string;
  message?: string;
  variant?: StatePanelVariant;
  size?: StatePanelSize;
  actions?: ReactNode;
};

export default function StatePanel({
  title,
  message,
  variant = "empty",
  size = "section",
  actions,
}: StatePanelProps) {
  const role = variant === "error" ? "alert" : "status";
  const ariaLive = variant === "loading" ? "polite" : undefined;

  return (
    <div
      className={`${styles.panel} ${styles[size]} ${styles[variant]}`}
      role={role}
      aria-live={ariaLive}
    >
      <span className={styles.indicator} aria-hidden="true" />
      <div className={styles.content}>
        <h2 className={styles.title}>{title}</h2>
        {message && <p className={styles.message}>{message}</p>}
        {variant === "loading" && <div className={styles.shimmer} aria-hidden="true" />}
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </div>
  );
}
