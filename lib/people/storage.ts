import type { Me, Person, RelationshipLog } from "./types";
import { ME_STORAGE_KEY, PEOPLE_STORAGE_KEY, RELATIONSHIP_LOG_STORAGE_KEY } from "./types";

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
