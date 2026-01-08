"use client";

import type { Post, PostView } from "@/lib/api/types";

export const withEmptyFlags = (post: Post): PostView => ({
  ...post,
  likedByMe: false,
  bookmarkedByMe: false,
  repostedByMe: false,
});
