"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { createPost, uploadPostImage } from "@/lib/api/posts";
import { getErrorMessage } from "@/lib/api/client";
import type { PostView, PostVisibility, ReplyPolicy, User } from "@/lib/api/types";
import { validateImageFile } from "@/lib/media";
import { withEmptyFlags } from "./postView";

type UsePostComposersOptions = {
  postId: string;
  user: User | null;
  isAuthed: boolean;
  addReply: (parentId: string, reply: PostView) => void;
  setPost: (value: (prev: PostView | null) => PostView | null) => void;
  updatePost: (id: string, updater: (post: PostView) => PostView) => void;
  onError: (message: string) => void;
  onStart?: () => void;
  onQuoteCreated: (postId: string) => void;
};

export function usePostComposers({
  postId,
  user,
  isAuthed,
  addReply,
  setPost,
  updatePost,
  onError,
  onStart,
  onQuoteCreated,
}: UsePostComposersOptions) {
  const [replyDraft, setReplyDraft] = useState("");
  const [replyImageFile, setReplyImageFile] = useState<File | null>(null);
  const [replyImagePreview, setReplyImagePreview] = useState<string | null>(null);
  const [replyVisibility, setReplyVisibility] = useState<PostVisibility>("PUBLIC");
  const [replyPolicy, setReplyPolicy] = useState<ReplyPolicy>("EVERYONE");
  const [replyTargetId, setReplyTargetId] = useState<string | null>(postId);

  const [quoteDraft, setQuoteDraft] = useState("");
  const [quoteImageFile, setQuoteImageFile] = useState<File | null>(null);
  const [quoteImagePreview, setQuoteImagePreview] = useState<string | null>(null);
  const [quoteVisibility, setQuoteVisibility] = useState<PostVisibility>("PUBLIC");
  const [quoteReplyPolicy, setQuoteReplyPolicy] = useState<ReplyPolicy>("EVERYONE");
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const canReply = isAuthed && (replyDraft.trim().length > 0 || !!replyImageFile);
  const replyTarget = replyTargetId ?? postId;
  const replyLabel = useMemo(
    () =>
      replyTarget === postId
        ? "Replying to thread"
        : `Replying to ${replyTarget.slice(0, 8)}`,
    [postId, replyTarget],
  );

  const resetComposers = useCallback(() => {
    setReplyDraft("");
    setReplyImageFile(null);
    setReplyVisibility("PUBLIC");
    setReplyPolicy("EVERYONE");
    setReplyTargetId(postId);
    setQuoteDraft("");
    setQuoteImageFile(null);
    setQuoteVisibility("PUBLIC");
    setQuoteReplyPolicy("EVERYONE");
    setQuoteOpen(false);
    setQuoteLoading(false);
  }, [postId]);

  useEffect(() => {
    if (!replyImageFile) {
      setReplyImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(replyImageFile);
    setReplyImagePreview(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [replyImageFile]);

  useEffect(() => {
    if (!quoteImageFile) {
      setQuoteImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(quoteImageFile);
    setQuoteImagePreview(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [quoteImageFile]);

  const handleImageChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>, setFile: (file: File | null) => void) => {
      const file = event.target.files?.[0] ?? null;
      if (!file) {
        setFile(null);
        return;
      }
      const validationError = validateImageFile(file);
      if (validationError) {
        onError(validationError);
        event.target.value = "";
        setFile(null);
        return;
      }
      onStart?.();
      setFile(file);
    },
    [onError, onStart],
  );

  const clearReplyImage = useCallback(() => {
    setReplyImageFile(null);
  }, []);

  const clearQuoteImage = useCallback(() => {
    setQuoteImageFile(null);
  }, []);

  const submitReply = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!canReply) {
        return;
      }
      onStart?.();
      try {
        let imageUrl: string | undefined;
        if (replyImageFile) {
          const uploaded = await uploadPostImage(replyImageFile);
          imageUrl = uploaded.url;
        }
        const created = await createPost({
          text: replyDraft.trim() || undefined,
          replyToPostId: replyTarget,
          imageUrl,
          visibility: replyVisibility,
          replyPolicy,
        });
        const mapped: PostView = {
          ...withEmptyFlags(created),
          authorUsername: user?.username ?? created.authorUsername,
          authorDisplayName: user?.displayName ?? created.authorDisplayName,
          authorAvatarUrl: user?.avatarUrl ?? created.authorAvatarUrl,
        };
        addReply(replyTarget, mapped);
        setReplyDraft("");
        setReplyImageFile(null);
        setReplyTargetId(postId);
        setPost((prev) =>
          prev ? { ...prev, replyCount: prev.replyCount + 1 } : prev,
        );
        if (replyTarget !== postId) {
          updatePost(replyTarget, (current) => ({
            ...current,
            replyCount: current.replyCount + 1,
          }));
        }
      } catch (err) {
        onError(getErrorMessage(err));
      }
    },
    [
      addReply,
      canReply,
      onError,
      onStart,
      postId,
      replyDraft,
      replyImageFile,
      replyPolicy,
      replyTarget,
      replyVisibility,
      setPost,
      updatePost,
      user?.avatarUrl,
      user?.displayName,
      user?.username,
    ],
  );

  const submitQuote = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!isAuthed || quoteLoading) {
        return;
      }
      setQuoteLoading(true);
      onStart?.();
      try {
        const trimmed = quoteDraft.trim();
        let imageUrl: string | undefined;
        if (quoteImageFile) {
          const uploaded = await uploadPostImage(quoteImageFile);
          imageUrl = uploaded.url;
        }
        const created = await createPost({
          quoteOfPostId: postId,
          text: trimmed.length > 0 ? trimmed : undefined,
          imageUrl,
          visibility: quoteVisibility,
          replyPolicy: quoteReplyPolicy,
        });
        setQuoteDraft("");
        setQuoteOpen(false);
        setQuoteImageFile(null);
        onQuoteCreated(created.id);
      } catch (err) {
        onError(getErrorMessage(err));
      } finally {
        setQuoteLoading(false);
      }
    },
    [
      isAuthed,
      onError,
      onQuoteCreated,
      onStart,
      postId,
      quoteDraft,
      quoteImageFile,
      quoteLoading,
      quoteReplyPolicy,
      quoteVisibility,
    ],
  );

  return {
    replyDraft,
    setReplyDraft,
    replyImagePreview,
    replyVisibility,
    setReplyVisibility,
    replyPolicy,
    setReplyPolicy,
    replyTargetId,
    setReplyTargetId,
    replyLabel,
    canReply,
    quoteDraft,
    setQuoteDraft,
    quoteImagePreview,
    quoteVisibility,
    setQuoteVisibility,
    quoteReplyPolicy,
    setQuoteReplyPolicy,
    quoteOpen,
    setQuoteOpen,
    quoteLoading,
    handleReplyImageChange: (event: ChangeEvent<HTMLInputElement>) =>
      handleImageChange(event, setReplyImageFile),
    handleQuoteImageChange: (event: ChangeEvent<HTMLInputElement>) =>
      handleImageChange(event, setQuoteImageFile),
    clearReplyImage,
    clearQuoteImage,
    submitReply,
    submitQuote,
    resetComposers,
  };
}
