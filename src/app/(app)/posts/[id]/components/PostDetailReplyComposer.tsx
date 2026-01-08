"use client";

import type { ChangeEvent, FormEvent, RefObject } from "react";
import type { PostVisibility, ReplyPolicy } from "@/lib/api/types";
import styles from "../PostDetailView.module.css";

type SelectOption<T extends string> = {
  value: T;
  label: string;
};

type PostDetailReplyComposerProps = {
  composerRef: RefObject<HTMLFormElement | null>;
  replyLabel: string;
  showReplyToThread: boolean;
  onReplyToThread: () => void;
  replyVisibility: PostVisibility;
  onReplyVisibilityChange: (value: PostVisibility) => void;
  replyPolicy: ReplyPolicy;
  onReplyPolicyChange: (value: ReplyPolicy) => void;
  replyImagePreview: string | null;
  onReplyImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearReplyImage: () => void;
  replyDraft: string;
  onReplyDraftChange: (value: string) => void;
  canReply: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  visibilityOptions: SelectOption<PostVisibility>[];
  replyPolicyOptions: SelectOption<ReplyPolicy>[];
};

export default function PostDetailReplyComposer({
  composerRef,
  replyLabel,
  showReplyToThread,
  onReplyToThread,
  replyVisibility,
  onReplyVisibilityChange,
  replyPolicy,
  onReplyPolicyChange,
  replyImagePreview,
  onReplyImageChange,
  onClearReplyImage,
  replyDraft,
  onReplyDraftChange,
  canReply,
  onSubmit,
  visibilityOptions,
  replyPolicyOptions,
}: PostDetailReplyComposerProps) {
  return (
    <form
      ref={composerRef}
      className={`${styles.composer} ${styles.composerCard}`}
      onSubmit={onSubmit}
    >
      <div className={styles.replyMeta}>
        <span>{replyLabel}</span>
        {showReplyToThread && (
          <button type="button" onClick={onReplyToThread}>
            Reply to thread
          </button>
        )}
      </div>
      <div className={styles.composerControls}>
        <label className={styles.control}>
          <span>Visibility</span>
          <select
            value={replyVisibility}
            onChange={(event) =>
              onReplyVisibilityChange(event.target.value as PostVisibility)
            }
          >
            {visibilityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.control}>
          <span>Replies</span>
          <select
            value={replyPolicy}
            onChange={(event) =>
              onReplyPolicyChange(event.target.value as ReplyPolicy)
            }
          >
            {replyPolicyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.control}>
          <span>Image</span>
          <input type="file" accept="image/*" onChange={onReplyImageChange} />
        </label>
      </div>
      {replyImagePreview && (
        <div className={styles.imagePreview}>
          <img src={replyImagePreview} alt="" />
          <button type="button" onClick={onClearReplyImage}>
            Remove image
          </button>
        </div>
      )}
      <textarea
        value={replyDraft}
        onChange={(event) => onReplyDraftChange(event.target.value)}
        placeholder="Write a reply..."
        maxLength={280}
      />
      <div className={styles.composerFooter}>
        <span>{replyDraft.trim().length}/280</span>
        <button type="submit" disabled={!canReply}>
          Reply
        </button>
      </div>
    </form>
  );
}
