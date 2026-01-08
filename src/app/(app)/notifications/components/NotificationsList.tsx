"use client";

import type { ComponentType } from "react";
import {
  Bell,
  Heart,
  MessageCircle,
  Quote,
  Repeat2,
  UserPlus,
} from "lucide-react";
import type { Notification } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import styles from "../NotificationsView.module.css";

const notificationLabel: Record<Notification["type"], string> = {
  LIKE: "liked your post",
  REPLY: "replied to your post",
  FOLLOW: "followed you",
  REPOST: "reposted your post",
  QUOTE: "quoted your post",
  MENTION: "mentioned you",
};

const notificationIcon: Record<
  Notification["type"],
  ComponentType<{ className?: string; "aria-hidden"?: boolean }>
> = {
  LIKE: Heart,
  REPLY: MessageCircle,
  FOLLOW: UserPlus,
  REPOST: Repeat2,
  QUOTE: Quote,
  MENTION: Bell,
};

type NotificationsListProps = {
  notifications: Notification[];
  pending: Set<string>;
  onOpen: (notification: Notification) => void;
  onMarkRead: (notification: Notification) => void;
};

export default function NotificationsList({
  notifications,
  pending,
  onOpen,
  onMarkRead,
}: NotificationsListProps) {
  return (
    <div className={styles.list}>
      {notifications.map((notification) => {
        const isUnread = !notification.readAt;
        const label = notificationLabel[notification.type];
        const Icon = notificationIcon[notification.type];
        const handle =
          notification.actor?.username ?? notification.actorId.slice(0, 8);
        const displayName =
          notification.actor?.displayName ?? notification.actorId.slice(0, 8);
        const initialsSource = notification.actor?.displayName ?? handle;
        const avatarLabel = initialsSource.slice(0, 2).toUpperCase();
        const avatarUrl = resolveMediaUrl(notification.actor?.avatarUrl ?? null);
        return (
          <div
            key={notification.id}
            className={`${styles.item} ${isUnread ? styles.unread : ""}`}
          >
            <button
              className={styles.card}
              type="button"
              onClick={() => onOpen(notification)}
            >
              <div className={styles.avatar}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className={styles.avatarImage} />
                ) : (
                  avatarLabel
                )}
              </div>
              <div className={styles.content}>
                <div className={styles.titleRow}>
                  <span className={styles.handle}>{displayName}</span>
                  <span className={styles.handleMuted}>@{handle}</span>
                  <span className={styles.dot} />
                  <span className={styles.time}>
                    {formatDate(notification.createdAt)}
                  </span>
                </div>
                <div className={styles.body}>
                  <span className={styles.typeIcon}>
                    <Icon aria-hidden="true" />
                  </span>
                  {label}
                </div>
              </div>
            </button>
            {isUnread && (
              <button
                type="button"
                className={styles.markRead}
                onClick={() => onMarkRead(notification)}
                disabled={pending.has(notification.id)}
              >
                {pending.has(notification.id) ? "Marking..." : "Mark read"}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
