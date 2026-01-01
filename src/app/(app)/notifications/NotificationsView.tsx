"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { listNotifications, markNotificationRead } from "@/lib/api/notifications";
import { getErrorMessage } from "@/lib/api/client";
import type { Notification } from "@/lib/api/types";
import { useSession } from "@/lib/auth/useSession";
import { formatDate } from "@/lib/format";
import StatePanel from "@/components/state/StatePanel";
import styles from "./NotificationsView.module.css";

type FilterKey = "all" | "unread";

const notificationLabel: Record<Notification["type"], string> = {
  LIKE: "liked your post",
  REPLY: "replied to your post",
  FOLLOW: "followed you",
  REPOST: "reposted your post",
  QUOTE: "quoted your post",
  MENTION: "mentioned you",
};

export default function NotificationsView() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const [items, setItems] = useState<Notification[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [pending, setPending] = useState<Set<string>>(new Set());

  const unreadOnly = filter === "unread";

  const loadNotifications = useCallback(
    async (reset: boolean, cursorOverride?: string | null) => {
      setLoading(true);
      setError("");
      try {
        const nextCursor = reset ? undefined : cursorOverride ?? undefined;
        const response = await listNotifications({
          limit: 15,
          cursor: nextCursor,
          unreadOnly,
        });
        setItems((prev) => (reset ? response.items : [...prev, ...response.items]));
        setCursor(response.nextCursor ?? null);
        setHasNext(response.hasNext);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [unreadOnly],
  );

  useEffect(() => {
    if (sessionLoading) return;
    if (!user) return;
    setItems([]);
    setCursor(null);
    setHasNext(false);
    void loadNotifications(true, null);
  }, [loadNotifications, sessionLoading, user, filter]);

  const markRead = useCallback(async (notification: Notification) => {
    if (notification.readAt) return;
    setPending((prev) => new Set(prev).add(notification.id));
    setError("");
    try {
      const updated = await markNotificationRead(notification.id);
      setItems((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPending((prev) => {
        const next = new Set(prev);
        next.delete(notification.id);
        return next;
      });
    }
  }, []);

  const handleOpen = useCallback(
    async (notification: Notification) => {
      if (!notification.readAt) {
        await markRead(notification);
      }
      if (notification.postId) {
        router.push(`/posts/${notification.postId}`);
      } else {
        router.push(`/users/${notification.actorId}`);
      }
    },
    [markRead, router],
  );

  const emptyState = useMemo(() => {
    if (loading) {
      return {
        variant: "loading" as const,
        title: "Loading notifications",
        message: "Pulling your latest updates.",
      };
    }
    if (!items.length) {
      return {
        variant: "empty" as const,
        title: unreadOnly ? "No unread notifications" : "No notifications yet",
        message: unreadOnly
          ? "You're all caught up."
          : "New likes, replies, and follows will show up here.",
      };
    }
    return null;
  }, [items.length, loading, unreadOnly]);

  if (sessionLoading) {
    return (
      <StatePanel
        size="page"
        variant="loading"
        title="Checking your session"
        message="Hang tight while we verify your login."
      />
    );
  }

  if (!user) {
    return (
      <StatePanel
        size="page"
        variant="info"
        title="Log in to view notifications"
        message="Create an account or sign in to keep track of replies and likes."
        actions={
          <>
            <Link href="/login" data-variant="primary">
              Log in
            </Link>
            <Link href="/register">Create account</Link>
          </>
        }
      />
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.nav}>
        <Link href="/feed" className={styles.back}>
          <- Back to feed
        </Link>
        <div className={styles.navMeta}>Notifications</div>
      </header>

      <div className={styles.filters}>
        <button
          type="button"
          className={`${styles.filterButton} ${
            filter === "all" ? styles.activeFilter : ""
          }`}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button
          type="button"
          className={`${styles.filterButton} ${
            filter === "unread" ? styles.activeFilter : ""
          }`}
          onClick={() => setFilter("unread")}
        >
          Unread
        </button>
      </div>

      {error && (
        <StatePanel variant="error" title="Unable to load notifications" message={error} />
      )}

      {emptyState ? (
        <StatePanel
          variant={emptyState.variant}
          title={emptyState.title}
          message={emptyState.message}
        />
      ) : (
        <div className={styles.list}>
          {items.map((notification) => {
            const isUnread = !notification.readAt;
            const label = notificationLabel[notification.type];
            const handle = notification.actorId.slice(0, 8);
            return (
              <div
                key={notification.id}
                className={`${styles.item} ${isUnread ? styles.unread : ""}`}
              >
                <button
                  className={styles.card}
                  type="button"
                  onClick={() => handleOpen(notification)}
                >
                  <div className={styles.avatar}>{handle.slice(0, 2).toUpperCase()}</div>
                  <div className={styles.content}>
                    <div className={styles.titleRow}>
                      <span className={styles.handle}>@{handle}</span>
                      <span className={styles.dot} />
                      <span className={styles.time}>
                        {formatDate(notification.createdAt)}
                      </span>
                    </div>
                    <div className={styles.body}>{label}</div>
                  </div>
                </button>
                {isUnread && (
                  <button
                    type="button"
                    className={styles.markRead}
                    onClick={() => markRead(notification)}
                    disabled={pending.has(notification.id)}
                  >
                    {pending.has(notification.id) ? "Marking..." : "Mark read"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {hasNext && (
        <button
          className={styles.loadMore}
          onClick={() => loadNotifications(false, cursor)}
          disabled={loading}
        >
          {loading ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
}
