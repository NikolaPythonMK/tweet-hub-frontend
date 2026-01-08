"use client";

import type { ChangeEvent, FormEvent } from "react";
import type { PostVisibility, ReplyPolicy } from "@/lib/api/types";
import styles from "../FeedView.module.css";

type SelectOption<T extends string> = {
  value: T;
  label: string;
};

type FeedComposerProps = {
  draft: string;
  onDraftChange: (value: string) => void;
  imagePreview: string | null;
  onImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearImage: () => void;
  visibility: PostVisibility;
  onVisibilityChange: (value: PostVisibility) => void;
  replyPolicy: ReplyPolicy;
  onReplyPolicyChange: (value: ReplyPolicy) => void;
  posting: boolean;
  canSubmit: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  visibilityOptions: SelectOption<PostVisibility>[];
  replyPolicyOptions: SelectOption<ReplyPolicy>[];
};

export default function FeedComposer({
  draft,
  onDraftChange,
  imagePreview,
  onImageChange,
  onClearImage,
  visibility,
  onVisibilityChange,
  replyPolicy,
  onReplyPolicyChange,
  posting,
  canSubmit,
  onSubmit,
  visibilityOptions,
  replyPolicyOptions,
}: FeedComposerProps) {
  return (
    <form className={styles.composer} onSubmit={onSubmit}>
      <div className={styles.composerControls}>
        <label className={styles.control}>
          <span>Visibility</span>
          <select
            value={visibility}
            onChange={(event) => onVisibilityChange(event.target.value as PostVisibility)}
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
            onChange={(event) => onReplyPolicyChange(event.target.value as ReplyPolicy)}
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
          <input type="file" accept="image/*" onChange={onImageChange} />
        </label>
      </div>
      {imagePreview && (
        <div className={styles.imagePreview}>
          <img src={imagePreview} alt="" />
          <button type="button" onClick={onClearImage}>
            Remove image
          </button>
        </div>
      )}
      <textarea
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        placeholder="Share a short thought..."
        maxLength={280}
      />
      <div className={styles.composerFooter}>
        <span>{draft.trim().length}/280</span>
        <button type="submit" disabled={!canSubmit}>
          {posting ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  );
}
