"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getUnreadNotificationsCount } from "@/lib/api/notifications";
import { logout } from "@/lib/api/auth";
import { useSession } from "@/lib/auth/useSession";
import styles from "./AppHeader.module.css";

export default function AppHeader() {
  const { user, setUser } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    let active = true;
    getUnreadNotificationsCount()
      .then((response) => {
        if (active) {
          setUnreadCount(response.count);
        }
      })
      .catch(() => {
        if (active) {
          setUnreadCount(0);
        }
      });

    return () => {
      active = false;
    };
  }, [pathname, user]);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setUnreadCount(0);
    router.push("/");
  };

  const initials = useMemo(() => {
    if (!user) return "??";
    return user.displayName.slice(0, 2).toUpperCase();
  }, [user]);

  const profileHref = user ? `/users/${user.username}` : "/login";
  const brandHref = user ? "/feed" : "/";

  return (
    <header className={styles.header}>
      <Link href={brandHref} className={styles.brand}>
        <span className={styles.brandMark} />
        <span>Tweet Hub</span>
      </Link>
      <div className={styles.actions}>
        {user ? (
          <>
            <Link href="/bookmarks" className={styles.actionLink}>
              <span>Bookmarks</span>
            </Link>
            <Link href="/notifications" className={styles.actionLink}>
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className={styles.badge}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
            <Link
              href={profileHref}
              className={styles.profile}
              aria-label="Profile"
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className={styles.avatarImage} />
              ) : (
                <span className={styles.avatar}>{initials}</span>
              )}
            </Link>
            <button className={styles.ghost} onClick={handleLogout}>
              Log out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className={styles.authLink}>
              Log in
            </Link>
            <Link href="/register" className={styles.authLinkSecondary}>
              Create account
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
