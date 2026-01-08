"use client";

import type { ChangeEvent, FormEvent } from "react";
import type { PostVisibility, ReplyPolicy } from "@/lib/api/types";
import styles from "../PostDetailView.module.css";

type SelectOption<T extends string> = {
  value: T;
  label: string;
};

type PostDetailQuoteComposerProps = {
  isOpen: boolean;
  onToggle: () => void;
  quoteDraft: string;
  onQuoteDraftChange: (value: string) => void;
  quoteVisibility: PostVisibility;
  onQuoteVisibilityChange: (value: PostVisibility) => void;
  quoteReplyPolicy: ReplyPolicy;
  onQuoteReplyPolicyChange: (value: ReplyPolicy) => void;
  quoteImagePreview: string | null;
  onQuoteImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearQuoteImage: () => void;
  quoteLoading: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  visibilityOptions: SelectOption<PostVisibility>[];
  replyPolicyOptions: SelectOption<ReplyPolicy>[];
};

export default function PostDetailQuoteComposer({
  isOpen,
  onToggle,
  quoteDraft,
  onQuoteDraftChange,
  quoteVisibility,
  onQuoteVisibilityChange,
  quoteReplyPolicy,
  onQuoteReplyPolicyChange,
  quoteImagePreview,
  onQuoteImageChange,
  onClearQuoteImage,
  quoteLoading,
  onSubmit,
  visibilityOptions,
  replyPolicyOptions,
}: PostDetailQuoteComposerProps) {
  return (
    <div className={styles.quoteBlock}>
      <button type="button" className={styles.quoteToggle} onClick={onToggle}>
        {isOpen ? "Cancel quote" : "Quote this post"}
      </button>
      {isOpen && (
        <form className={styles.quoteForm} onSubmit={onSubmit}>
          <div className={styles.composerControls}>
            <label className={styles.control}>
              <span>Visibility</span>
              <select
                value={quoteVisibility}
                onChange={(event) =>
                  onQuoteVisibilityChange(event.target.value as PostVisibility)
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
                value={quoteReplyPolicy}
                onChange={(event) =>
                  onQuoteReplyPolicyChange(event.target.value as ReplyPolicy)
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
              <input type="file" accept="image/*" onChange={onQuoteImageChange} />
            </label>
          </div>
          {quoteImagePreview && (
            <div className={styles.imagePreview}>
              <img src={quoteImagePreview} alt="" />
              <button type="button" onClick={onClearQuoteImage}>
                Remove image
              </button>
            </div>
          )}
          <textarea
            value={quoteDraft}
            onChange={(event) => onQuoteDraftChange(event.target.value)}
            placeholder="Add a comment (optional)"
            maxLength={280}
          />
          <div className={styles.composerFooter}>
            <span>{quoteDraft.trim().length}/280</span>
            <button type="submit" disabled={quoteLoading}>
              {quoteLoading ? "Posting..." : "Post quote"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
