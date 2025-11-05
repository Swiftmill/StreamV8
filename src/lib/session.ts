import crypto from 'node:crypto';
import dayjs from 'dayjs';
import { SESSION_STORE_PATH } from './paths.js';
import { readJSONFile, writeJSONFile } from './fileStore.js';

export type SessionRole = 'admin' | 'user';

export interface SessionRecord {
  id: string;
  username: string;
  role: SessionRole;
  createdAt: string;
  expiresAt: string;
  csrfToken: string;
}

interface SessionStore {
  sessions: SessionRecord[];
}

const SESSION_TTL_DAYS = 7;

function sessionSecret(): string {
  return process.env.SESSION_SECRET ?? 'streamv8-insecure-development-secret';
}

async function loadStore(): Promise<SessionStore> {
  return readJSONFile<SessionStore>(SESSION_STORE_PATH, { sessions: [] });
}

async function persistStore(store: SessionStore): Promise<void> {
  await writeJSONFile(SESSION_STORE_PATH, store);
}

function generateToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

export async function createSession(username: string, role: SessionRole): Promise<SessionRecord> {
  const store = await loadStore();
  const id = crypto.randomUUID();
  const csrfToken = generateToken();
  const createdAt = dayjs();
  const expiresAt = createdAt.add(SESSION_TTL_DAYS, 'day');
  const session: SessionRecord = {
    id,
    username,
    role,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    csrfToken
  };
  const nextSessions = store.sessions.filter((item) => dayjs(item.expiresAt).isAfter(dayjs()));
  nextSessions.push(session);
  await persistStore({ sessions: nextSessions });
  return session;
}

export async function getSession(sessionId: string): Promise<SessionRecord | null> {
  const store = await loadStore();
  const now = dayjs();
  const activeSessions = store.sessions.filter((session) => dayjs(session.expiresAt).isAfter(now));
  if (activeSessions.length !== store.sessions.length) {
    await persistStore({ sessions: activeSessions });
  }
  return activeSessions.find((session) => session.id === sessionId) ?? null;
}

export async function touchSession(sessionId: string): Promise<void> {
  const store = await loadStore();
  const now = dayjs();
  let changed = false;
  const sessions = store.sessions.map((session) => {
    if (session.id === sessionId && dayjs(session.expiresAt).isAfter(now)) {
      changed = true;
      const newExpires = dayjs().add(SESSION_TTL_DAYS, 'day').toISOString();
      return { ...session, expiresAt: newExpires };
    }
    return session;
  });
  if (changed) {
    await persistStore({ sessions });
  }
}

export async function invalidateSession(sessionId: string): Promise<void> {
  const store = await loadStore();
  const sessions = store.sessions.filter((session) => session.id !== sessionId);
  await persistStore({ sessions });
}

export function signSessionId(sessionId: string): string {
  const hmac = crypto.createHmac('sha256', sessionSecret());
  hmac.update(sessionId);
  return hmac.digest('hex');
}

export function serializeSessionCookie(sessionId: string): string {
  const signature = signSessionId(sessionId);
  const token = `${sessionId}.${signature}`;
  const expires = dayjs().add(SESSION_TTL_DAYS, 'day').toDate();
  const cookie = [`session=${token}`, `Path=/`, `HttpOnly`, `SameSite=Strict`, `Expires=${expires.toUTCString()}`];
  if (process.env.NODE_ENV === 'production') {
    cookie.push('Secure');
  }
  return cookie.join('; ');
}

export function parseSessionCookie(rawCookie: string | undefined): string | null {
  if (!rawCookie) {
    return null;
  }
  const [sessionId, signature] = rawCookie.split('.');
  if (!sessionId || !signature) {
    return null;
  }
  const expected = signSessionId(sessionId);
  if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))) {
    return null;
  }
  return sessionId;
}

export function requireCsrfToken(session: SessionRecord, token: string): boolean {
  return crypto.timingSafeEqual(Buffer.from(session.csrfToken, 'utf8'), Buffer.from(token, 'utf8'));
}
