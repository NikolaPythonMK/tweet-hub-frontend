"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { User } from "@/lib/api/types";
import StatePanel from "@/components/state/StatePanel";
import styles from "../ProfileView.module.css";

type UserListProps = {
  users: User[];
  emptyTitle: string;
  emptyMessage: string;
  showEmpty: boolean;
  renderAction?: (user: User) => ReactNode;
};

export default function UserList({
  users,
  emptyTitle,
  emptyMessage,
  showEmpty,
  renderAction,
}: UserListProps) {
  return (
    <>
      {showEmpty && (
        <StatePanel variant="empty" title={emptyTitle} message={emptyMessage} />
      )}
      <div className={styles.userList}>
        {users.map((user) => (
          <div key={user.id} className={styles.userCard}>
            <Link href={`/users/${user.username}`} className={styles.userInfo}>
              <div className={styles.userAvatar}>
                {user.displayName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className={styles.userName}>{user.displayName}</div>
                <div className={styles.userHandle}>@{user.username}</div>
              </div>
            </Link>
            {renderAction?.(user)}
          </div>
        ))}
      </div>
    </>
  );
}
