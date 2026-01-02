import { apiFetch } from "./client";
import type { CursorPage, Notification } from "./types";

export type ListNotificationsParams = {
  cursor?: string;
  limit?: number;
  unreadOnly?: boolean;
};

export async function listNotifications(
  params: ListNotificationsParams = {},
): Promise<CursorPage<Notification>> {
  const search = new URLSearchParams();
  if (params.cursor) search.set("cursor", params.cursor);
  if (params.limit) search.set("limit", String(params.limit));
  if (params.unreadOnly) {
    search.set("unreadOnly", "true");
  }
  const query = search.toString();
  return apiFetch(`/notifications${query ? `?${query}` : ""}`, { method: "GET" });
}

export async function markNotificationRead(
  id: string,
): Promise<Notification> {
  return apiFetch(`/notifications/${id}/read`, { method: "PATCH" });
}

export async function getUnreadNotificationsCount(): Promise<{ count: number }> {
  return apiFetch("/notifications/unread-count", { method: "GET" });
}
