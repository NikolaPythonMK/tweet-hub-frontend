"use client";

import { useCallback, useEffect, useState } from "react";
import type { User, UserStats } from "@/lib/api/types";
import {
  followUser,
  getFollowStatus,
  listFollowers,
  listFollowing,
  unfollowUser,
} from "@/lib/api/users";
import { useCursorList } from "@/lib/hooks/useCursorList";

type UseProfileRelationsOptions = {
  profileId: string | null;
  isAuthed: boolean;
  isSelf: boolean;
  sessionUserId?: string;
  runAction: (key: string, action: () => Promise<void>) => Promise<void>;
  updateStats: (updater: (prev: UserStats | null) => UserStats | null) => void;
  onError?: (error: unknown) => void;
  onStart?: () => void;
};

export function useProfileRelations({
  profileId,
  isAuthed,
  isSelf,
  sessionUserId,
  runAction,
  updateStats,
  onError,
  onStart,
}: UseProfileRelationsOptions) {
  const [followStatusById, setFollowStatusById] = useState<Record<string, boolean>>(
    {},
  );

  const fetchFollowers = useCallback(
    async (cursor?: string | null) => {
      if (!profileId) {
        return { items: [], nextCursor: null, hasNext: false };
      }
      const response = await listFollowers(profileId, {
        limit: 20,
        cursor: cursor ?? undefined,
      });
      return {
        items: response.items,
        nextCursor: response.nextCursor ?? null,
        hasNext: response.hasNext,
      };
    },
    [profileId],
  );

  const {
    items: followers,
    hasNext: followersHasNext,
    loading: loadingFollowers,
    loaded: followersLoaded,
    loadMore: loadMoreFollowers,
    reset: resetFollowers,
  } = useCursorList<User>({
    enabled: !!profileId,
    auto: false,
    fetchPage: fetchFollowers,
    onError,
    onStart,
  });

  const fetchFollowing = useCallback(
    async (cursor?: string | null) => {
      if (!profileId) {
        return { items: [], nextCursor: null, hasNext: false };
      }
      const response = await listFollowing(profileId, {
        limit: 20,
        cursor: cursor ?? undefined,
      });
      return {
        items: response.items,
        nextCursor: response.nextCursor ?? null,
        hasNext: response.hasNext,
      };
    },
    [profileId],
  );

  const {
    items: following,
    setItems: setFollowing,
    hasNext: followingHasNext,
    loading: loadingFollowing,
    loaded: followingLoaded,
    loadMore: loadMoreFollowing,
    reset: resetFollowing,
  } = useCursorList<User>({
    enabled: !!profileId,
    auto: false,
    fetchPage: fetchFollowing,
    onError,
    onStart,
  });

  useEffect(() => {
    if (!isAuthed || !isSelf || !followers.length) {
      return;
    }
    const targets = followers.filter(
      (item) => item.id !== sessionUserId && followStatusById[item.id] === undefined,
    );
    if (!targets.length) {
      return;
    }
    let active = true;
    const loadStatuses = async () => {
      const results = await Promise.allSettled(
        targets.map((item) => getFollowStatus(item.id)),
      );
      if (!active) {
        return;
      }
      setFollowStatusById((prev) => {
        const next = { ...prev };
        results.forEach((result, index) => {
          const id = targets[index]?.id;
          if (!id) return;
          if (result.status === "fulfilled") {
            next[id] = result.value.following;
          }
        });
        return next;
      });
    };
    void loadStatuses();
    return () => {
      active = false;
    };
  }, [followers, followStatusById, isAuthed, isSelf, sessionUserId]);

  const handleUnfollowFromList = useCallback(
    (target: User) =>
      runAction(`unfollow:${target.id}`, async () => {
        await unfollowUser(target.id);
        setFollowing((prev) => prev.filter((item) => item.id !== target.id));
        updateStats((prev) =>
          prev ? { ...prev, followingCount: Math.max(0, prev.followingCount - 1) } : prev,
        );
        setFollowStatusById((prev) => ({ ...prev, [target.id]: false }));
      }),
    [runAction, setFollowing, updateStats],
  );

  const handleFollowToggleFromFollowers = useCallback(
    (target: User) =>
      runAction(`follow:${target.id}`, async () => {
        const isFollowingTarget = followStatusById[target.id] ?? false;
        if (isFollowingTarget) {
          await unfollowUser(target.id);
          setFollowStatusById((prev) => ({ ...prev, [target.id]: false }));
          updateStats((prev) =>
            prev ? { ...prev, followingCount: Math.max(0, prev.followingCount - 1) } : prev,
          );
          setFollowing((prev) => prev.filter((item) => item.id !== target.id));
          return;
        }
        await followUser(target.id);
        setFollowStatusById((prev) => ({ ...prev, [target.id]: true }));
        updateStats((prev) =>
          prev ? { ...prev, followingCount: prev.followingCount + 1 } : prev,
        );
        if (followingLoaded) {
          setFollowing((prev) =>
            prev.some((item) => item.id === target.id) ? prev : [target, ...prev],
          );
        }
      }),
    [followStatusById, followingLoaded, runAction, setFollowing, updateStats],
  );

  return {
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
  };
}
