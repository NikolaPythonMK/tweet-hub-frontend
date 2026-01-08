"use client";

import type { User } from "@/lib/api/types";
import UserList from "./UserList";
import styles from "../ProfileView.module.css";

type ProfileFollowingSectionProps = {
  following: User[];
  followingLoaded: boolean;
  followingHasNext: boolean;
  loadingFollowing: boolean;
  observeFollowingLoadMore: (node: HTMLDivElement | null) => void;
  isSelf: boolean;
  pending: Set<string>;
  onUnfollow: (user: User) => void;
};

export default function ProfileFollowingSection({
  following,
  followingLoaded,
  followingHasNext,
  loadingFollowing,
  observeFollowingLoadMore,
  isSelf,
  pending,
  onUnfollow,
}: ProfileFollowingSectionProps) {
  return (
    <section className={styles.listSection}>
      <UserList
        users={following}
        showEmpty={following.length === 0 && followingLoaded && !loadingFollowing}
        emptyTitle="Not following anyone yet"
        emptyMessage="Explore profiles and follow people to see them here."
        renderAction={(followed) => {
          if (!isSelf) {
            return null;
          }
          const isPending = pending.has(`unfollow:${followed.id}`);
          return (
            <button
              className={styles.unfollowButton}
              type="button"
              onClick={() => onUnfollow(followed)}
              disabled={isPending}
            >
              {isPending ? "Removing..." : "Unfollow"}
            </button>
          );
        }}
      />
      {(followingHasNext || loadingFollowing) && following.length > 0 && (
        <div ref={observeFollowingLoadMore} className="loadMoreSentinel">
          {loadingFollowing ? "Loading more following..." : "Scroll for more"}
        </div>
      )}
    </section>
  );
}
