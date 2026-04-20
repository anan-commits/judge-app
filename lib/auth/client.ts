"use client";

import type { AuthUser, Gender, MeProfile } from "./types";

type JsonRecord = Record<string, unknown>;

async function parseJson<T>(res: Response): Promise<T> {
  const data = (await res.json()) as T;
  return data;
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const res = await fetch("/api/auth/me", { credentials: "include" });
  if (!res.ok) return null;
  const data = await parseJson<{ user: AuthUser | null }>(res);
  return data.user ?? null;
}

export async function signup(email: string, password: string): Promise<AuthUser> {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  const data = await parseJson<{ user?: AuthUser; error?: string }>(res);
  if (!res.ok || !data.user) {
    throw new Error(data.error || "登録に失敗しました");
  }
  return data.user;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  const data = await parseJson<{ user?: AuthUser; error?: string }>(res);
  if (!res.ok || !data.user) {
    throw new Error(data.error || "ログインに失敗しました");
  }
  return data.user;
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
}

export async function fetchProfile(): Promise<MeProfile | null> {
  const res = await fetch("/api/me/profile", { credentials: "include" });
  if (!res.ok) return null;
  const data = await parseJson<{ profile: MeProfile }>(res);
  return data.profile;
}

export async function saveProfile(input: {
  name: string;
  birthDate?: string;
  birthTime?: string;
  gender?: Gender;
}): Promise<MeProfile> {
  const res = await fetch("/api/me/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  const data = await parseJson<{ profile?: MeProfile; error?: string }>(res);
  if (!res.ok || !data.profile) {
    throw new Error(data.error || "プロフィール保存に失敗しました");
  }
  return data.profile;
}

async function fetchScoped<T>(url: string, key: string): Promise<T | null> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) return null;
  const data = (await res.json()) as JsonRecord;
  return (data[key] as T) ?? null;
}

async function saveScoped<T>(url: string, payloadKey: string, data: T): Promise<T | null> {
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ [payloadKey]: data }),
  });
  if (!res.ok) return null;
  const parsed = (await res.json()) as JsonRecord;
  return (parsed[payloadKey] as T) ?? null;
}

export async function fetchMyPeople() {
  return fetchScoped("/api/me/people", "people");
}

export async function saveMyPeople(people: unknown[]) {
  return saveScoped("/api/me/people", "people", people);
}

export async function fetchMyLogs() {
  return fetchScoped("/api/me/logs", "logs");
}

export async function saveMyLogs(logs: unknown[]) {
  return saveScoped("/api/me/logs", "logs", logs);
}
