import type { MeProfile } from "../auth/types";

export type Person = {
  id: string;
  name: string;
  birthDate?: string;
  birthTime?: string;
  memo?: string;
};

export type Relationship = {
  personId: string;
  type: "love" | "work" | "friend" | "family";
};

export type Me = MeProfile;

export type RelationshipLog = {
  id: string;
  personId: string;
  type: "line" | "date" | "call" | "note";
  content: string;
  timestamp: number;
};

export const ME_STORAGE_KEY = "judge_me";
export const PEOPLE_STORAGE_KEY = "judge_people";
export const RELATIONSHIP_LOG_STORAGE_KEY = "judge_relationship_logs";
