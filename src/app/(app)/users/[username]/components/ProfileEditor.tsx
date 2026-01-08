"use client";

import type { ChangeEvent } from "react";
import styles from "../ProfileView.module.css";

type ProfileEditorProps = {
  profileForm: { displayName: string; bio: string };
  avatarPreview: string | null;
  canSaveProfile: boolean;
  savingProfile: boolean;
  onChangeDisplayName: (value: string) => void;
  onChangeBio: (value: string) => void;
  onAvatarChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onCancel: () => void;
  onSave: () => void;
};

export default function ProfileEditor({
  profileForm,
  avatarPreview,
  canSaveProfile,
  savingProfile,
  onChangeDisplayName,
  onChangeBio,
  onAvatarChange,
  onCancel,
  onSave,
}: ProfileEditorProps) {
  return (
    <section className={styles.editor}>
      <div className={styles.editorHeader}>
        <h2>Edit profile</h2>
        <span>Public details</span>
      </div>
      <div className={styles.editorFields}>
        <label className={styles.field}>
          <span>Display name</span>
          <input
            value={profileForm.displayName}
            onChange={(event) => onChangeDisplayName(event.target.value)}
            placeholder="Display name"
          />
        </label>
        <label className={styles.field}>
          <span>Bio</span>
          <textarea
            value={profileForm.bio}
            onChange={(event) => onChangeBio(event.target.value)}
            placeholder="Short bio"
            maxLength={160}
          />
        </label>
        <label className={styles.field}>
          <span>Avatar URL</span>
          <input type="file" accept="image/*" onChange={onAvatarChange} />
          {avatarPreview && (
            <img src={avatarPreview} alt="" className={styles.avatarPreview} />
          )}
        </label>
      </div>
      <div className={styles.editorActions}>
        <button className={styles.secondaryButton} type="button" onClick={onCancel}>
          Cancel
        </button>
        <button
          className={styles.primaryButton}
          type="button"
          onClick={onSave}
          disabled={!canSaveProfile}
        >
          {savingProfile ? "Saving..." : "Save changes"}
        </button>
      </div>
    </section>
  );
}
