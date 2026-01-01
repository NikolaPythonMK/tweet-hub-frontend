"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { login, register } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/client";
import { useSession } from "@/lib/auth/useSession";
import styles from "./AuthForm.module.css";

type AuthFormProps = {
  mode: "login" | "register";
};

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const { user, loading: sessionLoading, setUser, refresh } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    identifier: "",
    password: "",
    username: "",
    displayName: "",
    email: "",
  });

  const isRegister = mode === "register";
  const isBusy = loading || sessionLoading;
  const passwordValid = form.password.length >= 8;
  const registerReady =
    form.username.trim().length > 0 &&
    form.displayName.trim().length > 0 &&
    form.email.trim().length > 0 &&
    passwordValid;
  const loginReady =
    form.identifier.trim().length > 0 && form.password.trim().length > 0;
  const canSubmit = !isBusy && (isRegister ? registerReady : loginReady);

  const updateField = (field: keyof typeof form) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (!sessionLoading && user) {
      router.replace("/feed");
    }
  }, [router, sessionLoading, user]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = isRegister
        ? await register({
            username: form.username.trim(),
            displayName: form.displayName.trim(),
            email: form.email.trim(),
            password: form.password,
          })
        : await login({
            identifier: form.identifier.trim(),
            password: form.password,
          });
      setUser(response.user);
      await refresh();
      router.push("/feed");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className={styles.status} role="status">
        Checking your session...
      </div>
    );
  }

  if (user) {
    return (
      <div className={styles.status} role="status">
        You are already signed in. Redirecting...
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <h1 className={styles.title}>{isRegister ? "Create account" : "Log in"}</h1>
      {isRegister && (
        <>
          <label className={styles.field}>
            <span>Username</span>
            <input
              value={form.username}
              onChange={(event) => updateField("username")(event.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              disabled={isBusy}
              required
            />
          </label>
          <label className={styles.field}>
            <span>Display name</span>
            <input
              value={form.displayName}
              onChange={(event) =>
                updateField("displayName")(event.target.value)
              }
              autoComplete="name"
              disabled={isBusy}
              required
            />
          </label>
          <label className={styles.field}>
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField("email")(event.target.value)}
              autoComplete="email"
              autoCapitalize="none"
              disabled={isBusy}
              required
            />
          </label>
        </>
      )}

      {!isRegister && (
        <label className={styles.field}>
          <span>Email or username</span>
          <input
            value={form.identifier}
            onChange={(event) => updateField("identifier")(event.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            disabled={isBusy}
            required
          />
        </label>
      )}

      <label className={styles.field}>
        <span>Password</span>
        <input
          type="password"
          value={form.password}
          onChange={(event) => updateField("password")(event.target.value)}
          autoComplete={isRegister ? "new-password" : "current-password"}
          disabled={isBusy}
          minLength={8}
          required
        />
      </label>

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      <button className={styles.submit} type="submit" disabled={!canSubmit}>
        {loading ? "Working..." : isRegister ? "Create account" : "Log in"}
      </button>

    </form>
  );
}
