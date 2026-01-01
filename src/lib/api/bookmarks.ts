import { apiFetch } from "./client";
import type { Bookmark, CursorPage } from "./types";

export type ListBookmarksParams = {
  cursor?: string;
  limit?: number;
};

export async function listBookmarks(
  params: ListBookmarksParams = {},
): Promise<CursorPage<Bookmark>> {
  const search = new URLSearchParams();
  if (params.cursor) search.set("cursor", params.cursor);
  if (params.limit) search.set("limit", String(params.limit));
  const query = search.toString();
  return apiFetch(`/bookmarks${query ? `?${query}` : ""}`, { method: "GET" });
}
