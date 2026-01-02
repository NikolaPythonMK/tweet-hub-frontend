import { apiFetch } from "./client";
import type { CursorPage, User, UserStats } from "./types";

export type ListUsersParams = {
  cursor?: string;
  limit?: number;
};

export async function getUserByUsername(
  username: string,
): Promise<{ user: User }> {
  return apiFetch(`/users/by-username/${encodeURIComponent(username)}`, {
    method: "GET",
  });
}

export async function getUserById(id: string): Promise<{ user: User }> {
  return apiFetch(`/users/${id}`, { method: "GET" });
}

export async function getUserStats(id: string): Promise<UserStats> {
  return apiFetch(`/users/${id}/stats`, { method: "GET" });
}

export async function getFollowStatus(
  id: string,
): Promise<{ following: boolean }> {
  return apiFetch(`/users/${id}/follow-status`, { method: "GET" });
}

export async function followUser(followingId: string): Promise<void> {
  await apiFetch("/follows", { method: "POST", json: { followingId } });
}

export async function unfollowUser(followingId: string): Promise<void> {
  await apiFetch(`/follows/${followingId}`, { method: "DELETE" });
}

export async function listFollowers(
  userId: string,
  params: ListUsersParams = {},
): Promise<CursorPage<User>> {
  const search = new URLSearchParams();
  if (params.cursor) search.set("cursor", params.cursor);
  if (params.limit) search.set("limit", String(params.limit));
  const query = search.toString();
  return apiFetch(`/users/${userId}/followers${query ? `?${query}` : ""}`, {
    method: "GET",
  });
}

export async function listFollowing(
  userId: string,
  params: ListUsersParams = {},
): Promise<CursorPage<User>> {
  const search = new URLSearchParams();
  if (params.cursor) search.set("cursor", params.cursor);
  if (params.limit) search.set("limit", String(params.limit));
  const query = search.toString();
  return apiFetch(`/users/${userId}/following${query ? `?${query}` : ""}`, {
    method: "GET",
  });
}

export async function updateProfile(payload: {
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
}): Promise<{ user: User }> {
  return apiFetch("/users/me", { method: "PATCH", json: payload });
}

export async function uploadAvatar(
  file: File,
): Promise<{ user: User }> {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch("/users/me/avatar", { method: "POST", body: formData });
}
