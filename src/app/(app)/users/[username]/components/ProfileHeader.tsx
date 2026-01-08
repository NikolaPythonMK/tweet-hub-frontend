"use client";

import type { User } from "@/lib/api/types";
import styles from "../ProfileView.module.css";

type ProfileHeaderProps = {
  profile: User;
  avatarSrc: string | null;
  avatarLabel: string;
  isSelf: boolean;
  isFollowing: boolean;
  followLoading: boolean;
  editing: boolean;
  onToggleEdit: () => void;
  onFollow: () => void;
};

export default function ProfileHeader({
  profile,
  avatarSrc,
  avatarLabel,
  isSelf,
  isFollowing,
  followLoading,
  editing,
  onToggleEdit,
  onFollow,
}: ProfileHeaderProps) {
  return (
    <section className={styles.profileCard}>
      <div className={styles.avatar}>
        {avatarSrc ? (
          <img src={avatarSrc} alt="" className={styles.avatarImage} />
        ) : (
          avatarLabel
        )}
      </div>
      <div className={styles.identity}>
        <h1 className={styles.name}>{profile.displayName}</h1>
        <p className={styles.handle}>@{profile.username}</p>
        {profile.bio && <p className={styles.bio}>{profile.bio}</p>}
      </div>
      <div className={styles.actions}>
        {isSelf ? (
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={onToggleEdit}
          >
            {editing ? "Close editor" : "Edit profile"}
          </button>
        ) : (
          <button
            className={isFollowing ? styles.secondaryButton : styles.primaryButton}
            type="button"
            onClick={onFollow}
            disabled={followLoading}
          >
            {followLoading ? "Working..." : isFollowing ? "Following" : "Follow"}
          </button>
        )}
      </div>
    </section>
  );
}
