import { apiFetch } from "./client";
import type { User } from "./types";

export type LoginPayload = {
  identifier: string;
  password: string;
};

export type RegisterPayload = {
  username: string;
  displayName: string;
  email: string;
  password: string;
};

export async function register(payload: RegisterPayload): Promise<{ user: User }> {
  return apiFetch("/auth/register", { method: "POST", json: payload });
}

export async function login(payload: LoginPayload): Promise<{ user: User }> {
  return apiFetch("/auth/login", { method: "POST", json: payload });
}

export async function refresh(): Promise<{ user: User }> {
  return apiFetch("/auth/refresh", { method: "POST", retry: false });
}

export async function logout(): Promise<{ ok: boolean }> {
  return apiFetch("/auth/logout", { method: "POST" });
}

export async function me(): Promise<{ user: User }> {
  return apiFetch("/me", { method: "GET" });
}
