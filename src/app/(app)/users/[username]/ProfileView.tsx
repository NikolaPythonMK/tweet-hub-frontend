"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  bookmarkPost,
  likePost,
  listFeed,
  listPosts,
  repostPost,
  unbookmarkPost,
  unlikePost,
  unrepostPost,
} from "@/lib/api/posts";
import {
  followUser,
  getFollowStatus,
  getUserById,
  getUserByUsername,
  getUserStats,
  listFollowers,
  listFollowing,
  unfollowUser,
  updateProfile,
} from "@/lib/api/users";
import { getErrorMessage } from "@/lib/api/client";
import type { Post, PostView, User, UserStats } from "@/lib/api/types";
import { useSession } from "@/lib/auth/useSession";
import PostCard from "@/components/feed/PostCard";
import StatePanel from "@/components/state/StatePanel";
import styles from "./ProfileView.module.css";

type ProfileViewProps = {
  username: string;
};

type TabKey = "posts" | "followers" | "following";

const emptyFlags = (post: Post): PostView => ({
  ...post,
  likedByMe: false,
  bookmarkedByMe: false,
  repostedByMe: false,
});

export default function ProfileView({ username }: ProfileViewProps) {
  const { user: sessionUser, setUser: setSessionUser, loading: sessionLoading } =
    useSession();
  const [profile, setProfile] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<TabKey>("posts");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    displayName: "",
    bio: "",
    avatarUrl: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [posts, setPosts] = useState<PostView[]>([]);
  const [postsCursor, setPostsCursor] = useState<string | null>(null);
  const [postsHasNext, setPostsHasNext] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const [followers, setFollowers] = useState<User[]>([]);
  const [followersCursor, setFollowersCursor] = useState<string | null>(null);
  const [followersHasNext, setFollowersHasNext] = useState(false);
  const [followersLoaded, setFollowersLoaded] = useState(false);
  const [loadingFollowers, setLoadingFollowers] = useState(false);

  const [following, setFollowing] = useState<User[]>([]);
  const [followingCursor, setFollowingCursor] = useState<string | null>(null);
  const [followingHasNext, setFollowingHasNext] = useState(false);
  const [followingLoaded, setFollowingLoaded] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);

  const [pending, setPending] = useState<Set<string>>(new Set());

  const isAuthed = !!sessionUser;
  const isSelf = !!sessionUser && profile?.id === sessionUser.id;

  const avatarLabel = useMemo(() => {
    if (!profile) return "??";
    return profile.displayName.slice(0, 2).toUpperCase();
  }, [profile]);

  const canSaveProfile =
    profileForm.displayName.trim().length > 0 && !savingProfile;

  const updatePost = useCallback((id: string, updater: (post: PostView) => PostView) => {
    setPosts((prev) => prev.map((post) => (post.id === id ? updater(post) : post)));
  }, []);

  const runAction = useCallback(async (key: string, action: () => Promise<void>) => {
    setPending((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    setError("");
    try {
      await action();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPending((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }, []);

  const loadProfile = useCallback(async () => {
    setLoadingProfile(true);
    setError("");
    try {
      const isUuid = /^[0-9a-fA-F-]{36}$/.test(username);
      const response = isUuid
        ? await getUserById(username)
        : await getUserByUsername(username);
      setProfile(response.user);
      const statsResponse = await getUserStats(response.user.id);
      setStats(statsResponse);
      setProfileForm({
        displayName: response.user.displayName ?? "",
        bio: response.user.bio ?? "",
        avatarUrl: response.user.avatarUrl ?? "",
      });
      if (sessionUser && response.user.id !== sessionUser.id) {
        const status = await getFollowStatus(response.user.id);
        setIsFollowing(status.following);
      } else {
        setIsFollowing(false);
      }
    } catch (err) {
      setError(getErrorMessage(err));
      setProfile(null);
      setStats(null);
      setIsFollowing(false);
    } finally {
      setLoadingProfile(false);
    }
  }, [sessionUser, username]);

  const loadPosts = useCallback(
    async (reset: boolean, cursor?: string | null) => {
      if (!profile) return;
      setLoadingPosts(true);
      setError("");
      try {
        const nextCursor = reset ? undefined : cursor ?? undefined;
        if (isAuthed) {
          const response = await listFeed({
            authorId: profile.id,
            limit: 10,
            cursor: nextCursor,
          });
          setPosts((prev) => (reset ? response.items : [...prev, ...response.items]));
          setPostsCursor(response.nextCursor ?? null);
          setPostsHasNext(response.hasNext);
        } else {
          const response = await listPosts({
            authorId: profile.id,
            limit: 10,
            cursor: nextCursor,
          });
          const mapped = response.items.map((item) => emptyFlags(item));
          setPosts((prev) => (reset ? mapped : [...prev, ...mapped]));
          setPostsCursor(response.nextCursor ?? null);
          setPostsHasNext(response.hasNext);
        }
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoadingPosts(false);
      }
    },
    [isAuthed, profile],
  );

  const loadFollowers = useCallback(
    async (reset: boolean) => {
      if (!profile) return;
      setLoadingFollowers(true);
      setError("");
      try {
        const cursor = reset ? undefined : followersCursor ?? undefined;
        const response = await listFollowers(profile.id, { limit: 20, cursor });
        setFollowers((prev) => (reset ? response.items : [...prev, ...response.items]));
        setFollowersCursor(response.nextCursor ?? null);
        setFollowersHasNext(response.hasNext);
        setFollowersLoaded(true);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoadingFollowers(false);
      }
    },
    [followersCursor, profile],
  );

  const loadFollowing = useCallback(
    async (reset: boolean) => {
      if (!profile) return;
      setLoadingFollowing(true);
      setError("");
      try {
        const cursor = reset ? undefined : followingCursor ?? undefined;
        const response = await listFollowing(profile.id, { limit: 20, cursor });
        setFollowing((prev) => (reset ? response.items : [...prev, ...response.items]));
        setFollowingCursor(response.nextCursor ?? null);
        setFollowingHasNext(response.hasNext);
        setFollowingLoaded(true);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoadingFollowing(false);
      }
    },
    [followingCursor, profile],
  );

  useEffect(() => {
    setProfile(null);
    setStats(null);
    setTab("posts");
    setIsFollowing(false);
    setEditing(false);
    setSavingProfile(false);
    setPosts([]);
    setPostsCursor(null);
    setPostsHasNext(false);
    setFollowers([]);
    setFollowersCursor(null);
    setFollowersHasNext(false);
    setFollowersLoaded(false);
    setFollowing([]);
    setFollowingCursor(null);
    setFollowingHasNext(false);
    setFollowingLoaded(false);
    if (sessionLoading) return;
    void loadProfile();
  }, [loadProfile, sessionLoading, username]);

  useEffect(() => {
    if (!profile || sessionLoading) return;
    setPosts([]);
    setPostsCursor(null);
    setPostsHasNext(false);
    void loadPosts(true);
  }, [loadPosts, profile, sessionLoading]);

  useEffect(() => {
    if (!profile) return;
    if (tab === "followers" && !followersLoaded) {
      void loadFollowers(true);
    }
    if (tab === "following" && !followingLoaded) {
      void loadFollowing(true);
    }
  }, [followersLoaded, followingLoaded, loadFollowers, loadFollowing, profile, tab]);

  const toggleLike = useCallback(
    (target: PostView) =>
      runAction(`like:${target.id}`, async () => {
        if (target.likedByMe) {
          await unlikePost(target.id);
          updatePost(target.id, (current) => ({
            ...current,
            likedByMe: false,
            likeCount: Math.max(0, current.likeCount - 1),
          }));
        } else {
          await likePost(target.id);
          updatePost(target.id, (current) => ({
            ...current,
            likedByMe: true,
            likeCount: current.likeCount + 1,
          }));
        }
      }),
    [runAction, updatePost],
  );

  const toggleBookmark = useCallback(
    (target: PostView) =>
      runAction(`bookmark:${target.id}`, async () => {
        if (target.bookmarkedByMe) {
          await unbookmarkPost(target.id);
          updatePost(target.id, (current) => ({
            ...current,
            bookmarkedByMe: false,
          }));
        } else {
          await bookmarkPost(target.id);
          updatePost(target.id, (current) => ({
            ...current,
            bookmarkedByMe: true,
          }));
        }
      }),
    [runAction, updatePost],
  );

  const toggleRepost = useCallback(
    (target: PostView) =>
      runAction(`repost:${target.id}`, async () => {
        if (target.repostedByMe) {
          await unrepostPost(target.id);
          updatePost(target.id, (current) => ({
            ...current,
            repostedByMe: false,
            repostCount: Math.max(0, current.repostCount - 1),
          }));
        } else {
          await repostPost(target.id);
          updatePost(target.id, (current) => ({
            ...current,
            repostedByMe: true,
            repostCount: current.repostCount + 1,
          }));
        }
      }),
    [runAction, updatePost],
  );

  const handleFollow = async () => {
    if (!profile) return;
    if (!isAuthed) {
      setError("Log in to follow profiles.");
      return;
    }
    setFollowLoading(true);
    setError("");
    try {
      if (isFollowing) {
        await unfollowUser(profile.id);
        setIsFollowing(false);
        setStats((prev) =>
          prev ? { ...prev, followerCount: Math.max(0, prev.followerCount - 1) } : prev,
        );
      } else {
        await followUser(profile.id);
        setIsFollowing(true);
        setStats((prev) =>
          prev ? { ...prev, followerCount: prev.followerCount + 1 } : prev,
        );
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setFollowLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!canSaveProfile) {
      setError("Display name is required.");
      return;
    }
    setSavingProfile(true);
    setError("");
    try {
      const response = await updateProfile({
        displayName: profileForm.displayName.trim(),
        bio: profileForm.bio.trim() || null,
        avatarUrl: profileForm.avatarUrl.trim() || null,
      });
      setProfile(response.user);
      setSessionUser(response.user);
      setEditing(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

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
      <header className={styles.nav}>
        <Link href="/feed" className={styles.back}>
          {"<- Back to feed"}
        </Link>
        <div className={styles.navMeta}>Profile</div>
      </header>

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
            <section className={styles.profileCard}>
              <div className={styles.avatar}>{avatarLabel}</div>
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
                    onClick={() => setEditing((prev) => !prev)}
                  >
                    {editing ? "Close editor" : "Edit profile"}
                  </button>
                ) : (
                  <button
                    className={isFollowing ? styles.secondaryButton : styles.primaryButton}
                    type="button"
                    onClick={handleFollow}
                    disabled={followLoading}
                  >
                    {followLoading
                      ? "Working..."
                      : isFollowing
                        ? "Following"
                        : "Follow"}
                  </button>
                )}
              </div>
            </section>

            {isSelf && editing && (
              <section className={styles.editor}>
                <div className={styles.editorHeader}>
                  <h2>Edit profile</h2>
                  <span>Public details</span>
                </div>
                <div className={styles.editorFields}>
                  <label className={styles.field}>
                    <span>Display name</span>
                    <input
                      value={profileForm.displayName}
                      onChange={(event) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          displayName: event.target.value,
                        }))
                      }
                      placeholder="Display name"
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Bio</span>
                    <textarea
                      value={profileForm.bio}
                      onChange={(event) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          bio: event.target.value,
                        }))
                      }
                      placeholder="Short bio"
                      maxLength={160}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Avatar URL</span>
                    <input
                      value={profileForm.avatarUrl}
                      onChange={(event) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          avatarUrl: event.target.value,
                        }))
                      }
                      placeholder="https://"
                    />
                  </label>
                </div>
                <div className={styles.editorActions}>
                  <button
                    className={styles.secondaryButton}
                    type="button"
                    onClick={() => {
                      setProfileForm({
                        displayName: profile.displayName ?? "",
                        bio: profile.bio ?? "",
                        avatarUrl: profile.avatarUrl ?? "",
                      });
                      setEditing(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className={styles.primaryButton}
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={!canSaveProfile}
                  >
                    {savingProfile ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </section>
            )}

            <section className={styles.stats}>
              <div className={styles.statCard}>
                <span>Posts</span>
                <strong>{stats?.postCount ?? 0}</strong>
              </div>
              <div className={styles.statCard}>
                <span>Followers</span>
                <strong>{stats?.followerCount ?? 0}</strong>
              </div>
              <div className={styles.statCard}>
                <span>Following</span>
                <strong>{stats?.followingCount ?? 0}</strong>
              </div>
            </section>

            <div className={styles.tabs}>
              <button
                type="button"
                className={`${styles.tabButton} ${tab === "posts" ? styles.activeTab : ""}`}
                onClick={() => setTab("posts")}
              >
                Posts
              </button>
              <button
                type="button"
                className={`${styles.tabButton} ${
                  tab === "followers" ? styles.activeTab : ""
                }`}
                onClick={() => setTab("followers")}
              >
                Followers
              </button>
              <button
                type="button"
                className={`${styles.tabButton} ${
                  tab === "following" ? styles.activeTab : ""
                }`}
                onClick={() => setTab("following")}
              >
                Following
              </button>
            </div>

            {error && (
              <StatePanel variant="error" title="Action failed" message={error} />
            )}

            {tab === "posts" && (
              <section className={styles.listSection}>
                {posts.length === 0 && !loadingPosts && (
                  <StatePanel
                    variant="empty"
                    title="No posts yet"
                    message="Share the first post to get the timeline moving."
                  />
                )}
                <div className={styles.postList}>
                  {posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onLike={isAuthed ? toggleLike : undefined}
                      onBookmark={isAuthed ? toggleBookmark : undefined}
                      onRepost={isAuthed ? toggleRepost : undefined}
                      pending={{
                        like: pending.has(`like:${post.id}`),
                        bookmark: pending.has(`bookmark:${post.id}`),
                        repost: pending.has(`repost:${post.id}`),
                      }}
                      showActions={isAuthed}
                    />
                  ))}
                </div>
                {postsHasNext && (
                  <button
                    className={styles.loadMore}
                    onClick={() => loadPosts(false, postsCursor)}
                    disabled={loadingPosts}
                  >
                    {loadingPosts ? "Loading..." : "Load more posts"}
                  </button>
                )}
              </section>
            )}

            {tab === "followers" && (
              <section className={styles.listSection}>
                {followers.length === 0 && followersLoaded && !loadingFollowers && (
                  <StatePanel
                    variant="empty"
                    title="No followers yet"
                    message="When someone follows this profile, they will show up here."
                  />
                )}
                <div className={styles.userList}>
                  {followers.map((follower) => (
                    <Link
                      key={follower.id}
                      href={`/users/${follower.username}`}
                      className={styles.userCard}
                    >
                      <div className={styles.userAvatar}>
                        {follower.displayName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className={styles.userName}>{follower.displayName}</div>
                        <div className={styles.userHandle}>@{follower.username}</div>
                      </div>
                    </Link>
                  ))}
                </div>
                {followersHasNext && (
                  <button
                    className={styles.loadMore}
                    onClick={() => loadFollowers(false)}
                    disabled={loadingFollowers}
                  >
                    {loadingFollowers ? "Loading..." : "Load more followers"}
                  </button>
                )}
              </section>
            )}

            {tab === "following" && (
              <section className={styles.listSection}>
                {following.length === 0 && followingLoaded && !loadingFollowing && (
                  <StatePanel
                    variant="empty"
                    title="Not following anyone yet"
                    message="Explore profiles and follow people to see them here."
                  />
                )}
                <div className={styles.userList}>
                  {following.map((followed) => (
                    <Link
                      key={followed.id}
                      href={`/users/${followed.username}`}
                      className={styles.userCard}
                    >
                      <div className={styles.userAvatar}>
                        {followed.displayName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className={styles.userName}>{followed.displayName}</div>
                        <div className={styles.userHandle}>@{followed.username}</div>
                      </div>
                    </Link>
                  ))}
                </div>
                {followingHasNext && (
                  <button
                    className={styles.loadMore}
                    onClick={() => loadFollowing(false)}
                    disabled={loadingFollowing}
                  >
                    {loadingFollowing ? "Loading..." : "Load more following"}
                  </button>
                )}
              </section>
            )}
          </>
        )
      )}
    </div>
  );
}
