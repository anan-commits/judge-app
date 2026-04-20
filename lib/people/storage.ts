import type { Me, Person, RelationshipLog } from "./types";
import { ME_STORAGE_KEY, PEOPLE_STORAGE_KEY, RELATIONSHIP_LOG_STORAGE_KEY } from "./types";
import { fetchCurrentUser, fetchMyLogs, fetchMyPeople, fetchProfile, saveMyLogs, saveMyPeople } from "../auth/client";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadMe(): Me | null {
  if (typeof window === "undefined") return null;
  return safeParse<Me>(localStorage.getItem(ME_STORAGE_KEY));
}

export function saveMe(me: Me): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ME_STORAGE_KEY, JSON.stringify(me));
}

export function loadPeople(): Person[] {
  if (typeof window === "undefined") return [];
  const parsed = safeParse<Person[]>(localStorage.getItem(PEOPLE_STORAGE_KEY));
  return Array.isArray(parsed) ? parsed : [];
}

export function savePeople(people: Person[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(people));
}

export function loadRelationshipLogs(): RelationshipLog[] {
  if (typeof window === "undefined") return [];
  const parsed = safeParse<RelationshipLog[]>(localStorage.getItem(RELATIONSHIP_LOG_STORAGE_KEY));
  return Array.isArray(parsed) ? parsed : [];
}

export function saveRelationshipLogs(logs: RelationshipLog[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(RELATIONSHIP_LOG_STORAGE_KEY, JSON.stringify(logs));
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await fetchCurrentUser();
  return Boolean(user);
}

export async function loadMeProfile(): Promise<Me | null> {
  const user = await fetchCurrentUser();
  if (!user) {
    return loadMe();
  }
  const profile = await fetchProfile();
  return profile ?? null;
}

export async function saveMeProfile(me: Me): Promise<void> {
  const user = await fetchCurrentUser();
  if (!user) {
    saveMe(me);
    return;
  }
  await fetch("/api/me/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      name: me.name,
      birthDate: me.birthDate || "",
      birthTime: me.birthTime || "",
      gender: me.gender,
    }),
  });
}

export async function loadPeopleByUser(): Promise<Person[]> {
  const user = await fetchCurrentUser();
  if (!user) {
    return loadPeople();
  }
  const people = await fetchMyPeople();
  return Array.isArray(people) ? (people as Person[]) : [];
}

export async function savePeopleByUser(people: Person[]): Promise<void> {
  const user = await fetchCurrentUser();
  if (!user) {
    savePeople(people);
    return;
  }
  await saveMyPeople(people);
}

export async function loadRelationshipLogsByUser(): Promise<RelationshipLog[]> {
  const user = await fetchCurrentUser();
  if (!user) {
    return loadRelationshipLogs();
  }
  const logs = await fetchMyLogs();
  return Array.isArray(logs) ? (logs as RelationshipLog[]) : [];
}

export async function saveRelationshipLogsByUser(logs: RelationshipLog[]): Promise<void> {
  const user = await fetchCurrentUser();
  if (!user) {
    saveRelationshipLogs(logs);
    return;
  }
  await saveMyLogs(logs);
}
