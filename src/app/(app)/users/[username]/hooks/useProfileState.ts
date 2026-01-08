"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import {
  followUser,
  getFollowStatus,
  getUserById,
  getUserByUsername,
  getUserStats,
  unfollowUser,
  updateProfile,
  uploadAvatar,
} from "@/lib/api/users";
import { getErrorMessage } from "@/lib/api/client";
import { resolveMediaUrl, validateImageFile } from "@/lib/media";
import type { User, UserStats } from "@/lib/api/types";

type UseProfileStateOptions = {
  username: string;
  sessionUser: User | null;
  sessionLoading: boolean;
  setSessionUser: (user: User | null) => void;
};

export function useProfileState({
  username,
  sessionUser,
  sessionLoading,
  setSessionUser,
}: UseProfileStateOptions) {
  const [profile, setProfile] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    displayName: "",
    bio: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const isAuthed = !!sessionUser;
  const isSelf = !!sessionUser && profile?.id === sessionUser.id;
  const profileId = profile?.id ?? null;

  const avatarLabel = useMemo(() => {
    if (!profile) return "??";
    return profile.displayName.slice(0, 2).toUpperCase();
  }, [profile]);
  const avatarSrc = resolveMediaUrl(profile?.avatarUrl ?? null);

  const canSaveProfile =
    profileForm.displayName.trim().length > 0 && !savingProfile;

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

  useEffect(() => {
    setProfile(null);
    setStats(null);
    setIsFollowing(false);
    setEditing(false);
    setSavingProfile(false);
    setAvatarFile(null);
    setAvatarPreview(null);
    setProfileForm({
      displayName: "",
      bio: "",
    });
    if (sessionLoading) return;
    void loadProfile();
  }, [loadProfile, sessionLoading, username]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null);
      return;
    }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [avatarFile]);

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

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setAvatarFile(null);
      return;
    }
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      event.target.value = "";
      setAvatarFile(null);
      return;
    }
    setError("");
    setAvatarFile(file);
  };

  const handleCancelEdit = () => {
    if (!profile) {
      return;
    }
    setProfileForm({
      displayName: profile.displayName ?? "",
      bio: profile.bio ?? "",
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    setEditing(false);
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
      });
      let nextUser = response.user;
      if (avatarFile) {
        const uploaded = await uploadAvatar(avatarFile);
        nextUser = uploaded.user;
      }
      setProfile(nextUser);
      setSessionUser(nextUser);
      setEditing(false);
      setAvatarFile(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const updateStats = useCallback(
    (updater: (prev: UserStats | null) => UserStats | null) => {
      setStats(updater);
    },
    [],
  );

  return {
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
  };
}
