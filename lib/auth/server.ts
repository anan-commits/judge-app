import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { NextRequest } from "next/server";
import type {
  AuthUser,
  MeProfile,
  PersonRecord,
  RelationshipLogRecord,
} from "./types";

const STORE_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(STORE_DIR, "auth-store.json");
const SESSION_COOKIE = "judge_session";
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 14;
export const AUTH_COOKIE_NAME = SESSION_COOKIE;
export const AUTH_COOKIE_MAX_AGE_SEC = SESSION_MAX_AGE_SEC;

type StoredUser = {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: number;
};

type Session = {
  token: string;
  userId: string;
  expiresAt: number;
};

type UserScopedData = {
  me: MeProfile | null;
  people: PersonRecord[];
  logs: RelationshipLogRecord[];
};

type AuthStore = {
  users: StoredUser[];
  sessions: Session[];
  dataByUserId: Record<string, UserScopedData>;
};

const emptyStore: AuthStore = {
  users: [],
  sessions: [],
  dataByUserId: {},
};

async function ensureStoreFile(): Promise<void> {
  await mkdir(STORE_DIR, { recursive: true });
  try {
    await readFile(STORE_PATH, "utf-8");
  } catch {
    await writeFile(STORE_PATH, JSON.stringify(emptyStore, null, 2), "utf-8");
  }
}

async function readStore(): Promise<AuthStore> {
  await ensureStoreFile();
  try {
    const raw = await readFile(STORE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as AuthStore;
    if (!Array.isArray(parsed.users) || !Array.isArray(parsed.sessions) || !parsed.dataByUserId) {
      return structuredClone(emptyStore);
    }
    return parsed;
  } catch {
    return structuredClone(emptyStore);
  }
}

async function writeStore(store: AuthStore): Promise<void> {
  await ensureStoreFile();
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
}

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString("hex");
}

function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const calculated = Buffer.from(hashPassword(password, salt), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  if (calculated.length !== expected.length) return false;
  return timingSafeEqual(calculated, expected);
}

function toAuthUser(user: StoredUser, me: MeProfile | null): AuthUser {
  return {
    id: user.id,
    email: user.email,
    profileCompleted: Boolean(me?.name),
  };
}

async function getSessionTokenFromRequest(req?: NextRequest): Promise<string | null> {
  if (req) {
    return req.cookies.get(SESSION_COOKIE)?.value ?? null;
  }
  return null;
}

export async function signupWithEmail(
  email: string,
  password: string
): Promise<{ user: AuthUser; token: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const store = await readStore();
  const existing = store.users.find((u) => u.email === normalizedEmail);
  if (existing) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }
  const id = randomUUID();
  const salt = randomBytes(16).toString("hex");
  const passwordHash = hashPassword(password, salt);
  const user: StoredUser = {
    id,
    email: normalizedEmail,
    salt,
    passwordHash,
    createdAt: Date.now(),
  };
  store.users.push(user);
  store.dataByUserId[id] = {
    me: {
      id,
      name: "",
      email: normalizedEmail,
    },
    people: [],
    logs: [],
  };
  const token = randomBytes(32).toString("hex");
  store.sessions.push({
    token,
    userId: id,
    expiresAt: Date.now() + SESSION_MAX_AGE_SEC * 1000,
  });
  await writeStore(store);
  return { user: toAuthUser(user, store.dataByUserId[id]?.me ?? null), token };
}

export async function loginWithEmail(
  email: string,
  password: string
): Promise<{ user: AuthUser; token: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const store = await readStore();
  const user = store.users.find((u) => u.email === normalizedEmail);
  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }
  if (!verifyPassword(password, user.salt, user.passwordHash)) {
    throw new Error("INVALID_CREDENTIALS");
  }
  const token = randomBytes(32).toString("hex");
  store.sessions.push({
    token,
    userId: user.id,
    expiresAt: Date.now() + SESSION_MAX_AGE_SEC * 1000,
  });
  await writeStore(store);
  return { user: toAuthUser(user, store.dataByUserId[user.id]?.me ?? null), token };
}

export async function logoutCurrentSession(req?: NextRequest): Promise<void> {
  const token = await getSessionTokenFromRequest(req);
  const store = await readStore();
  if (token) {
    store.sessions = store.sessions.filter((session) => session.token !== token);
    await writeStore(store);
  }
}

export async function getCurrentUser(req?: NextRequest): Promise<AuthUser | null> {
  const token = await getSessionTokenFromRequest(req);
  if (!token) return null;
  const store = await readStore();
  store.sessions = store.sessions.filter((session) => session.expiresAt > Date.now());
  const session = store.sessions.find((s) => s.token === token);
  if (!session) {
    await writeStore(store);
    return null;
  }
  const user = store.users.find((u) => u.id === session.userId);
  if (!user) {
    await writeStore(store);
    return null;
  }
  await writeStore(store);
  const me = store.dataByUserId[user.id]?.me ?? null;
  return toAuthUser(user, me);
}

async function getCurrentUserId(req?: NextRequest): Promise<string | null> {
  const token = await getSessionTokenFromRequest(req);
  if (!token) return null;
  const store = await readStore();
  store.sessions = store.sessions.filter((session) => session.expiresAt > Date.now());
  const session = store.sessions.find((s) => s.token === token);
  if (!session) {
    await writeStore(store);
    return null;
  }
  await writeStore(store);
  return session.userId;
}

async function withUserData<T>(
  req: NextRequest | undefined,
  cb: (store: AuthStore, userId: string, userData: UserScopedData) => T | Promise<T>
): Promise<T | null> {
  const userId = await getCurrentUserId(req);
  if (!userId) return null;
  const store = await readStore();
  const current = store.dataByUserId[userId] ?? { me: null, people: [], logs: [] };
  store.dataByUserId[userId] = current;
  const result = await cb(store, userId, current);
  await writeStore(store);
  return result;
}

export async function getMyProfile(req?: NextRequest): Promise<MeProfile | null> {
  const data = await withUserData(req, (_store, userId, userData) => {
    if (!userData.me) {
      userData.me = { id: userId, name: "" };
    }
    return userData.me;
  });
  return data ?? null;
}

export async function saveMyProfile(
  req: NextRequest | undefined,
  profile: Omit<MeProfile, "id">
): Promise<MeProfile | null> {
  const data = await withUserData(req, (store, userId, userData) => {
    const existingUser = store.users.find((u) => u.id === userId);
    const next: MeProfile = {
      id: userId,
      name: profile.name?.trim() || "",
      email: existingUser?.email,
      birthDate: profile.birthDate || "",
      birthTime: profile.birthTime || "",
      gender: profile.gender,
    };
    userData.me = next;
    return next;
  });
  return data ?? null;
}

export async function getMyPeople(req?: NextRequest): Promise<PersonRecord[] | null> {
  const data = await withUserData(req, (_store, _userId, userData) => userData.people ?? []);
  return data ?? null;
}

export async function saveMyPeople(
  req: NextRequest | undefined,
  people: PersonRecord[]
): Promise<PersonRecord[] | null> {
  const data = await withUserData(req, (_store, _userId, userData) => {
    userData.people = people;
    return userData.people;
  });
  return data ?? null;
}

export async function getMyRelationshipLogs(req?: NextRequest): Promise<RelationshipLogRecord[] | null> {
  const data = await withUserData(req, (_store, _userId, userData) => userData.logs ?? []);
  return data ?? null;
}

export async function saveMyRelationshipLogs(
  req: NextRequest | undefined,
  logs: RelationshipLogRecord[]
): Promise<RelationshipLogRecord[] | null> {
  const data = await withUserData(req, (_store, _userId, userData) => {
    userData.logs = logs;
    return userData.logs;
  });
  return data ?? null;
}
