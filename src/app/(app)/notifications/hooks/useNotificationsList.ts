"use client";

import { useCallback } from "react";
import { listNotifications, markNotificationRead } from "@/lib/api/notifications";
import type { Notification } from "@/lib/api/types";
import { useCursorList } from "@/lib/hooks/useCursorList";

type UseNotificationsListOptions = {
  userId?: string;
  sessionLoading: boolean;
  unreadOnly: boolean;
  runAction: (key: string, action: () => Promise<void>) => Promise<void>;
  onError?: (error: unknown) => void;
  onStart?: () => void;
};

export function useNotificationsList({
  userId,
  sessionLoading,
  unreadOnly,
  runAction,
  onError,
  onStart,
}: UseNotificationsListOptions) {
  const fetchNotifications = useCallback(
    async (cursor?: string | null) => {
      const response = await listNotifications({
        limit: 15,
        cursor: cursor ?? undefined,
        unreadOnly,
      });
      return response;
    },
    [unreadOnly],
  );

  const { items, setItems, hasNext, loading, loadMore } = useCursorList<Notification>({
    enabled: !!userId && !sessionLoading,
    fetchPage: fetchNotifications,
    deps: [unreadOnly, userId],
    onError,
    onStart,
  });

  const markRead = useCallback(
    async (notification: Notification) => {
      if (notification.readAt) return;
      return runAction(notification.id, async () => {
        const updated = await markNotificationRead(notification.id);
        setItems((prev) =>
          prev.map((item) =>
            item.id === updated.id
              ? { ...item, ...updated, actor: updated.actor ?? item.actor }
              : item,
          ),
        );
      });
    },
    [runAction, setItems],
  );

  return {
    items,
    hasNext,
    loading,
    loadMore,
    markRead,
  };
}
