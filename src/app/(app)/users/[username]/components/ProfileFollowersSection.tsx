"use client";

import type { User } from "@/lib/api/types";
import UserList from "./UserList";
import styles from "../ProfileView.module.css";

type ProfileFollowersSectionProps = {
  followers: User[];
  followersLoaded: boolean;
  followersHasNext: boolean;
  loadingFollowers: boolean;
  observeFollowersLoadMore: (node: HTMLDivElement | null) => void;
  isSelf: boolean;
  followStatusById: Record<string, boolean>;
  pending: Set<string>;
  onToggleFollow: (user: User) => void;
};

export default function ProfileFollowersSection({
  followers,
  followersLoaded,
  followersHasNext,
  loadingFollowers,
  observeFollowersLoadMore,
  isSelf,
  followStatusById,
  pending,
  onToggleFollow,
}: ProfileFollowersSectionProps) {
  return (
    <section className={styles.listSection}>
      <UserList
        users={followers}
        showEmpty={followers.length === 0 && followersLoaded && !loadingFollowers}
        emptyTitle="No followers yet"
        emptyMessage="When someone follows this profile, they will show up here."
        renderAction={(follower) => {
          if (!isSelf) {
            return null;
          }
          const isFollowingBack = followStatusById[follower.id] ?? false;
          const isPending =
            pending.has(`follow:${follower.id}`) ||
            pending.has(`unfollow:${follower.id}`);
          return (
            <button
              className={
                isFollowingBack ? styles.unfollowButton : styles.followBackButton
              }
              type="button"
              onClick={() => onToggleFollow(follower)}
              disabled={isPending}
            >
              {isPending
                ? "Working..."
                : isFollowingBack
                  ? "Unfollow"
                  : "Follow back"}
            </button>
          );
        }}
      />
      {(followersHasNext || loadingFollowers) && followers.length > 0 && (
        <div ref={observeFollowersLoadMore} className="loadMoreSentinel">
          {loadingFollowers ? "Loading more followers..." : "Scroll for more"}
        </div>
      )}
    </section>
  );
}
