"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { createPost, uploadPostImage } from "@/lib/api/posts";
import { getErrorMessage } from "@/lib/api/client";
import type { PostView, PostVisibility, ReplyPolicy, User } from "@/lib/api/types";
import { validateImageFile } from "@/lib/media";

type UseFeedComposerOptions = {
  user: User | null;
  onPostCreated: (post: PostView) => void;
  setError: (message: string) => void;
};

export function useFeedComposer({
  user,
  onPostCreated,
  setError,
}: UseFeedComposerOptions) {
  const [draft, setDraft] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<PostVisibility>("PUBLIC");
  const [replyPolicy, setReplyPolicy] = useState<ReplyPolicy>("EVERYONE");
  const [posting, setPosting] = useState(false);

  const hasContent = draft.trim().length > 0 || Boolean(imageFile);
  const canSubmit = Boolean(user) && hasContent && !posting;

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [imageFile]);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setImageFile(null);
      return;
    }
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      event.target.value = "";
      setImageFile(null);
      return;
    }
    setError("");
    setImageFile(file);
  };

  const clearImage = () => {
    setImageFile(null);
  };

  const submitPost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      return;
    }
    if (!draft.trim() && !imageFile) {
      return;
    }
    setError("");
    setPosting(true);
    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        const uploaded = await uploadPostImage(imageFile);
        imageUrl = uploaded.url;
      }
      const created = await createPost({
        text: draft.trim() || undefined,
        imageUrl,
        visibility,
        replyPolicy,
      });
      const withFlags: PostView = {
        ...created,
        likedByMe: false,
        bookmarkedByMe: false,
        repostedByMe: false,
        authorUsername: user.username,
        authorDisplayName: user.displayName,
        authorAvatarUrl: user.avatarUrl ?? null,
      };
      onPostCreated(withFlags);
      setDraft("");
      setImageFile(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPosting(false);
    }
  };

  return {
    draft,
    setDraft,
    imagePreview,
    visibility,
    setVisibility,
    replyPolicy,
    setReplyPolicy,
    posting,
    canSubmit,
    handleImageChange,
    clearImage,
    submitPost,
  };
}
