import { apiFetch } from "./client";
import type { CursorPage, Post, PostView } from "./types";

export type ListPostsParams = {
  cursor?: string;
  limit?: number;
  authorId?: string;
  replyToPostId?: string;
  rootPostId?: string;
  repostOfPostId?: string;
  quoteOfPostId?: string;
};

export type CreatePostPayload = {
  text?: string | null;
  imageUrl?: string | null;
  replyToPostId?: string | null;
  rootPostId?: string | null;
  repostOfPostId?: string | null;
  quoteOfPostId?: string | null;
};

export async function listPosts(
  params: ListPostsParams = {},
): Promise<CursorPage<Post>> {
  const search = new URLSearchParams();
  if (params.cursor) search.set("cursor", params.cursor);
  if (params.limit) search.set("limit", String(params.limit));
  if (params.authorId) search.set("authorId", params.authorId);
  if (params.replyToPostId) search.set("replyToPostId", params.replyToPostId);
  if (params.rootPostId) search.set("rootPostId", params.rootPostId);
  if (params.repostOfPostId) search.set("repostOfPostId", params.repostOfPostId);
  if (params.quoteOfPostId) search.set("quoteOfPostId", params.quoteOfPostId);
  const query = search.toString();
  return apiFetch(`/posts${query ? `?${query}` : ""}`, { method: "GET" });
}

export async function listFeed(
  params: ListPostsParams = {},
): Promise<CursorPage<PostView>> {
  const search = new URLSearchParams();
  if (params.cursor) search.set("cursor", params.cursor);
  if (params.limit) search.set("limit", String(params.limit));
  if (params.authorId) search.set("authorId", params.authorId);
  if (params.replyToPostId) search.set("replyToPostId", params.replyToPostId);
  if (params.rootPostId) search.set("rootPostId", params.rootPostId);
  if (params.repostOfPostId) search.set("repostOfPostId", params.repostOfPostId);
  if (params.quoteOfPostId) search.set("quoteOfPostId", params.quoteOfPostId);
  const query = search.toString();
  return apiFetch(`/posts/feed${query ? `?${query}` : ""}`, { method: "GET" });
}

export async function createPost(payload: CreatePostPayload): Promise<Post> {
  return apiFetch("/posts", { method: "POST", json: payload });
}

export async function getPost(postId: string): Promise<Post | null> {
  return apiFetch(`/posts/${postId}`, { method: "GET" });
}

export async function getPostView(postId: string): Promise<PostView | null> {
  return apiFetch(`/posts/${postId}/view`, { method: "GET" });
}

export async function likePost(postId: string): Promise<void> {
  await apiFetch(`/posts/${postId}/like`, { method: "POST" });
}

export async function unlikePost(postId: string): Promise<void> {
  await apiFetch(`/posts/${postId}/like`, { method: "DELETE" });
}

export async function bookmarkPost(postId: string): Promise<void> {
  await apiFetch(`/posts/${postId}/bookmark`, { method: "POST" });
}

export async function unbookmarkPost(postId: string): Promise<void> {
  await apiFetch(`/posts/${postId}/bookmark`, { method: "DELETE" });
}

export async function repostPost(postId: string): Promise<void> {
  await apiFetch(`/posts/${postId}/repost`, { method: "POST" });
}

export async function unrepostPost(postId: string): Promise<void> {
  await apiFetch(`/posts/${postId}/repost`, { method: "DELETE" });
}
