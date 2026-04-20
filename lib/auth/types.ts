export type Gender = "male" | "female" | "other";

export type MeProfile = {
  id: string;
  name: string;
  email?: string;
  birthDate?: string;
  birthTime?: string;
  gender?: Gender;
};

export type AuthUser = {
  id: string;
  email: string;
  profileCompleted: boolean;
};

export type PersonRecord = {
  id: string;
  name: string;
  birthDate?: string;
  birthTime?: string;
  memo?: string;
};

export type RelationshipLogRecord = {
  id: string;
  personId: string;
  type: "line" | "date" | "call" | "note";
  content: string;
  timestamp: number;
};
