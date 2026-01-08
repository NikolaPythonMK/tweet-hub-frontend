"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getErrorMessage } from "@/lib/api/client";
import type { Notification } from "@/lib/api/types";
import { useSession } from "@/lib/auth/useSession";
import { useInfiniteScroll } from "@/lib/hooks/useInfiniteScroll";
import { usePendingActions } from "@/lib/hooks/usePendingActions";
import StatePanel from "@/components/state/StatePanel";
import NotificationsFilters, {
  type NotificationsFilterKey,
} from "./components/NotificationsFilters";
import NotificationsHeader from "./components/NotificationsHeader";
import NotificationsList from "./components/NotificationsList";
import { useNotificationsList } from "./hooks/useNotificationsList";
import styles from "./NotificationsView.module.css";

export default function NotificationsView() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<NotificationsFilterKey>("all");
  const { pending, runAction } = usePendingActions({
    onError: (err) => setError(getErrorMessage(err)),
    onStart: () => setError(""),
  });

  const unreadOnly = filter === "unread";

  const {
    items: notificationItems,
    hasNext,
    loading,
    loadMore,
    markRead,
  } = useNotificationsList({
    userId: user?.id,
    sessionLoading,
    unreadOnly,
    runAction,
    onError: (err) => setError(getErrorMessage(err)),
    onStart: () => setError(""),
  });

  const observeLoadMore = useInfiniteScroll<HTMLDivElement>({
    enabled: !!user && hasNext && !loading,
    deps: [hasNext, loading, notificationItems.length, filter],
    onIntersect: () => {
      void loadMore();
    },
  });

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
    if (!notificationItems.length) {
      return {
        variant: "empty" as const,
        title: unreadOnly ? "No unread notifications" : "No notifications yet",
        message: unreadOnly
          ? "You're all caught up."
          : "New likes, replies, and follows will show up here.",
      };
    }
    return null;
  }, [loading, notificationItems.length, unreadOnly]);

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
      <NotificationsHeader title="Notifications" />

      <NotificationsFilters filter={filter} onChange={setFilter} />

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
        <NotificationsList
          notifications={notificationItems}
          pending={pending}
          onOpen={handleOpen}
          onMarkRead={markRead}
        />
      )}

      {(hasNext || loading) && notificationItems.length > 0 && (
        <div ref={observeLoadMore} className="loadMoreSentinel">
          {loading ? "Loading more notifications..." : "Scroll for more"}
        </div>
      )}
    </div>
  );
}
