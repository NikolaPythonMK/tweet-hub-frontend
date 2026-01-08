"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getErrorMessage } from "@/lib/api/client";
import { useSession } from "@/lib/auth/useSession";
import { useInfiniteScroll } from "@/lib/hooks/useInfiniteScroll";
import { usePendingActions } from "@/lib/hooks/usePendingActions";
import StatePanel from "@/components/state/StatePanel";
import BackToFeedHeader from "@/components/nav/BackToFeedHeader";
import ProfileEditor from "./components/ProfileEditor";
import ProfileFollowersSection from "./components/ProfileFollowersSection";
import ProfileFollowingSection from "./components/ProfileFollowingSection";
import ProfileHeader from "./components/ProfileHeader";
import ProfilePostsSection from "./components/ProfilePostsSection";
import ProfileStats from "./components/ProfileStats";
import ProfileTabs, { ProfileTabKey } from "./components/ProfileTabs";
import { useProfilePosts } from "./hooks/useProfilePosts";
import { useProfileRelations } from "./hooks/useProfileRelations";
import { useProfileState } from "./hooks/useProfileState";
import styles from "./ProfileView.module.css";

type ProfileViewProps = {
  username: string;
};

export default function ProfileView({ username }: ProfileViewProps) {
  const {
    user: sessionUser,
    setUser: setSessionUser,
    loading: sessionLoading,
  } = useSession();
  const [tab, setTab] = useState<ProfileTabKey>("posts");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [username]);

  const {
    profile,
    stats,
    updateStats,
    loadingProfile,
    error,
    setError,
    isAuthed,
    isSelf,
    profileId,
    isFollowing,
    followLoading,
    editing,
    setEditing,
    profileForm,
    setProfileForm,
    avatarPreview,
    avatarLabel,
    avatarSrc,
    canSaveProfile,
    savingProfile,
    handleFollow,
    handleAvatarChange,
    handleCancelEdit,
    handleSaveProfile,
  } = useProfileState({
    username,
    sessionUser,
    sessionLoading,
    setSessionUser,
  });

  const handleActionError = useCallback(
    (err: unknown) => setError(getErrorMessage(err)),
    [setError],
  );
  const handleActionStart = useCallback(() => setError(""), [setError]);

  const { pending, runAction } = usePendingActions({
    onError: handleActionError,
    onStart: handleActionStart,
  });

  const {
    posts,
    loadingPosts,
    postsHasNext,
    loadMorePosts,
    timeRange,
    setTimeRange,
    toggleLike,
    toggleBookmark,
    toggleRepost,
  } = useProfilePosts({
    profileId,
    isAuthed,
    sessionLoading,
    runAction,
    onError: handleActionError,
    onStart: handleActionStart,
  });

  const {
    followers,
    followersLoaded,
    followersHasNext,
    loadingFollowers,
    loadMoreFollowers,
    resetFollowers,
    following,
    followingLoaded,
    followingHasNext,
    loadingFollowing,
    loadMoreFollowing,
    resetFollowing,
    followStatusById,
    handleUnfollowFromList,
    handleFollowToggleFromFollowers,
  } = useProfileRelations({
    profileId,
    isAuthed,
    isSelf,
    sessionUserId: sessionUser?.id,
    runAction,
    updateStats,
    onError: handleActionError,
    onStart: handleActionStart,
  });

  useEffect(() => {
    if (!profileId) return;
    if (tab === "followers" && !followersLoaded) {
      void resetFollowers();
    }
    if (tab === "following" && !followingLoaded) {
      void resetFollowing();
    }
  }, [followersLoaded, followingLoaded, profileId, resetFollowers, resetFollowing, tab]);

  const observePostsLoadMore = useInfiniteScroll<HTMLDivElement>({
    enabled: tab === "posts" && postsHasNext && !loadingPosts,
    deps: [postsHasNext, loadingPosts, tab, posts.length],
    onIntersect: () => {
      void loadMorePosts();
    },
  });

  const observeFollowersLoadMore = useInfiniteScroll<HTMLDivElement>({
    enabled: tab === "followers" && followersHasNext && !loadingFollowers,
    deps: [followersHasNext, loadingFollowers, tab, followers.length],
    onIntersect: () => {
      void loadMoreFollowers();
    },
  });

  const observeFollowingLoadMore = useInfiniteScroll<HTMLDivElement>({
    enabled: tab === "following" && followingHasNext && !loadingFollowing,
    deps: [followingHasNext, loadingFollowing, tab, following.length],
    onIntersect: () => {
      void loadMoreFollowing();
    },
  });

  const emptyState = useMemo(() => {
    if (loadingProfile) {
      return {
        variant: "loading" as const,
        title: "Loading profile",
        message: "Pulling the latest profile details.",
      };
    }
    if (!profile) {
      return {
        variant: "empty" as const,
        title: "Profile not found",
        message: "Double-check the username or try again.",
      };
    }
    return null;
  }, [loadingProfile, profile]);

  return (
    <div className={styles.page}>
      <BackToFeedHeader
        className={styles.nav}
        backClassName={styles.back}
        metaClassName={styles.navMeta}
      >
        Profile
      </BackToFeedHeader>

      {emptyState ? (
        <StatePanel
          size="page"
          variant={emptyState.variant}
          title={emptyState.title}
          message={emptyState.message}
        />
      ) : (
        profile && (
          <>
            <ProfileHeader
              profile={profile}
              avatarSrc={avatarSrc}
              avatarLabel={avatarLabel}
              isSelf={isSelf}
              isFollowing={isFollowing}
              followLoading={followLoading}
              editing={editing}
              onToggleEdit={() => setEditing((prev) => !prev)}
              onFollow={handleFollow}
            />

            {isSelf && editing && (
              <ProfileEditor
                profileForm={profileForm}
                avatarPreview={avatarPreview}
                canSaveProfile={canSaveProfile}
                savingProfile={savingProfile}
                onChangeDisplayName={(value) =>
                  setProfileForm((prev) => ({ ...prev, displayName: value }))
                }
                onChangeBio={(value) =>
                  setProfileForm((prev) => ({ ...prev, bio: value }))
                }
                onAvatarChange={handleAvatarChange}
                onCancel={handleCancelEdit}
                onSave={handleSaveProfile}
              />
            )}

            <ProfileStats stats={stats} />

            <ProfileTabs tab={tab} onTabChange={setTab} />

            {error && (
              <StatePanel variant="error" title="Action failed" message={error} />
            )}

            {tab === "posts" && (
              <ProfilePostsSection
                posts={posts}
                loadingPosts={loadingPosts}
                postsHasNext={postsHasNext}
                observePostsLoadMore={observePostsLoadMore}
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
                isAuthed={isAuthed}
                pending={pending}
                onLike={toggleLike}
                onBookmark={toggleBookmark}
                onRepost={toggleRepost}
              />
            )}

            {tab === "followers" && (
              <ProfileFollowersSection
                followers={followers}
                followersLoaded={followersLoaded}
                followersHasNext={followersHasNext}
                loadingFollowers={loadingFollowers}
                observeFollowersLoadMore={observeFollowersLoadMore}
                isSelf={isSelf}
                followStatusById={followStatusById}
                pending={pending}
                onToggleFollow={handleFollowToggleFromFollowers}
              />
            )}

            {tab === "following" && (
              <ProfileFollowingSection
                following={following}
                followingLoaded={followingLoaded}
                followingHasNext={followingHasNext}
                loadingFollowing={loadingFollowing}
                observeFollowingLoadMore={observeFollowingLoadMore}
                isSelf={isSelf}
                pending={pending}
                onUnfollow={handleUnfollowFromList}
              />
            )}
          </>
        )
      )}
    </div>
  );
}
