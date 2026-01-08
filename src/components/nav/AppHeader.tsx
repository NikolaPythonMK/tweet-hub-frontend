"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getUnreadNotificationsCount } from "@/lib/api/notifications";
import { logout } from "@/lib/api/auth";
import { useSession } from "@/lib/auth/useSession";
import { Bell, Bookmark, Moon, Sun } from "lucide-react";
import { resolveMediaUrl } from "@/lib/media";
import styles from "./AppHeader.module.css";

export default function AppHeader() {
  const { user, setUser } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [themeMode, setThemeMode] = useState<"system" | "user">("system");
  const [themeReady, setThemeReady] = useState(false);

  const THEME_KEY = "theme";
  const THEME_MODE_KEY = "theme:mode";

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

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_KEY);
    const storedMode = localStorage.getItem(THEME_MODE_KEY);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isUserMode = storedMode === "user";
    if (isUserMode && (storedTheme === "light" || storedTheme === "dark")) {
      setTheme(storedTheme);
      setThemeMode("user");
      document.documentElement.dataset.theme = storedTheme;
    } else {
      const initialTheme = prefersDark ? "dark" : "light";
      setTheme(initialTheme);
      setThemeMode("system");
      document.documentElement.dataset.theme = initialTheme;
    }
    setThemeReady(true);
  }, []);

  useEffect(() => {
    if (!themeReady) {
      return;
    }
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
    localStorage.setItem(THEME_MODE_KEY, themeMode);
  }, [theme, themeMode, themeReady]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      if (themeMode === "user") {
        return;
      }
      setTheme(event.matches ? "dark" : "light");
      setThemeMode("system");
    };
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [themeMode]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== THEME_KEY && event.key !== THEME_MODE_KEY) {
        return;
      }
      const storedTheme = localStorage.getItem(THEME_KEY);
      const storedMode = localStorage.getItem(THEME_MODE_KEY);
      if (storedTheme === "light" || storedTheme === "dark") {
        setTheme(storedTheme);
      }
      setThemeMode(storedMode === "user" ? "user" : "system");
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      
    } finally {
      setUser(null);
      setUnreadCount(0);
      router.push("/");
    }
  };

  const initials = useMemo(() => {
    if (!user) return "??";
    return user.displayName.slice(0, 2).toUpperCase();
  }, [user]);
  const avatarSrc = resolveMediaUrl(user?.avatarUrl ?? null);

  const profileHref = user
    ? `/users/${encodeURIComponent(user.username || user.id)}`
    : "/login";
  const brandHref = "/feed";
  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    setThemeMode("user");
  };

  return (
    <header className={styles.header}>
      <Link href={brandHref} className={styles.brand} scroll={false}>
        <span className={styles.brandMark} />
        <span>Tweet Hub</span>
      </Link>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.actionLink}
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? (
            <Sun className={styles.actionIcon} aria-hidden="true" />
          ) : (
            <Moon className={styles.actionIcon} aria-hidden="true" />
          )}
        </button>
        {user ? (
          <>
            <Link href="/bookmarks" className={styles.actionLink}>
              <Bookmark className={styles.actionIcon} aria-hidden="true" />
              <span className="sr-only">Bookmarks</span>
            </Link>
            <Link href="/notifications" className={styles.actionLink}>
              <Bell className={styles.actionIcon} aria-hidden="true" />
              <span className="sr-only">Notifications</span>
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
              {avatarSrc ? (
                <img src={avatarSrc} alt="" className={styles.avatarImage} />
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
