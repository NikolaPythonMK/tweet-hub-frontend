import type { PostRepost, PostView, User } from "@/lib/api/types";

const applyUserToRepost = (repost: PostRepost, user: User): PostRepost => {
  if (
    repost.authorId !== user.id ||
    (repost.authorAvatarUrl === user.avatarUrl &&
      repost.authorDisplayName === user.displayName &&
      repost.authorUsername === user.username)
  ) {
    return repost;
  }

  return {
    ...repost,
    authorAvatarUrl: user.avatarUrl ?? null,
    authorDisplayName: user.displayName,
    authorUsername: user.username,
  };
};

export const applyUserToPost = (post: PostView, user: User): PostView => {
  let updated = post;

  if (
    post.authorId === user.id &&
    (post.authorAvatarUrl !== user.avatarUrl ||
      post.authorDisplayName !== user.displayName ||
      post.authorUsername !== user.username)
  ) {
    updated = {
      ...updated,
      authorAvatarUrl: user.avatarUrl ?? null,
      authorDisplayName: user.displayName,
      authorUsername: user.username,
    };
  }

  if (updated.repost) {
    const nextRepost = applyUserToRepost(updated.repost, user);
    if (nextRepost !== updated.repost) {
      updated = {
        ...updated,
        repost: nextRepost,
      };
    }
  }

  return updated;
};

export const applyUserToPosts = (posts: PostView[], user: User): PostView[] => {
  let changed = false;
  const next = posts.map((post) => {
    const updated = applyUserToPost(post, user);
    if (updated !== post) {
      changed = true;
    }
    return updated;
  });
  return changed ? next : posts;
};
