export type User = {
  id: string;
  username: string;
  displayName: string;
  email: string;
  bio?: string | null;
  avatarUrl?: string | null;
};

export type UserStats = {
  postCount: number;
  followerCount: number;
  followingCount: number;
};

export type PostVisibility = "PUBLIC" | "FOLLOWERS" | "PRIVATE";

export type ReplyPolicy =
  | "EVERYONE"
  | "FOLLOWERS"
  | "MENTIONED_ONLY"
  | "NOBODY";

export type Post = {
  id: string;
  authorId: string;
  authorUsername?: string;
  authorDisplayName?: string;
  authorAvatarUrl?: string | null;
  text?: string | null;
  imageUrl?: string | null;
  replyToPostId?: string | null;
  rootPostId?: string | null;
  repostOfPostId?: string | null;
  quoteOfPostId?: string | null;
  createdAt: string;
  visibility: PostVisibility;
  replyPolicy: ReplyPolicy;
  likeCount: number;
  replyCount: number;
  repostCount: number;
  quoteCount: number;
  viewCount: string;
  repost?: PostRepost | null;
};

export type PostRepost = {
  id: string;
  authorId: string;
  authorUsername?: string;
  authorDisplayName?: string;
  authorAvatarUrl?: string | null;
  text?: string | null;
  imageUrl?: string | null;
  createdAt: string;
};

export type PostView = Post & {
  likedByMe: boolean;
  bookmarkedByMe: boolean;
  repostedByMe: boolean;
};

export type CursorPage<T> = {
  items: T[];
  nextCursor?: string | null;
  hasNext: boolean;
};

export type Bookmark = {
  postId: string;
  userId: string;
  createdAt: string;
};

export type NotificationType =
  | "LIKE"
  | "REPLY"
  | "FOLLOW"
  | "REPOST"
  | "QUOTE"
  | "MENTION";

export type Notification = {
  id: string;
  recipientId: string;
  actorId: string;
  type: NotificationType;
  postId?: string | null;
  readAt?: string | null;
  createdAt: string;
};
