import "server-only";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { run, one } from "./db/client";
import type { UserRow } from "./db/queries";
import { findUserByEmail, findUserById } from "./db/queries";
import { hashPassword, sha256, verifyPassword } from "./password";

export const SESSION_COOKIE = "jb_session";
const SESSION_TTL_DAYS = 7;

export { hashPassword, verifyPassword };

/* ── Login throttling (in-memory, per process) ─────────────────────────────── */

type Attempt = { count: number; first: number };
const attempts = new Map<string, Attempt>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;

export function checkLoginRate(key: string): {
  allowed: boolean;
  retryInMinutes: number;
} {
  const entry = attempts.get(key);
  if (!entry) return { allowed: true, retryInMinutes: 0 };
  if (Date.now() - entry.first > WINDOW_MS) {
    attempts.delete(key);
    return { allowed: true, retryInMinutes: 0 };
  }
  if (entry.count >= MAX_ATTEMPTS) {
    const retry = Math.ceil((WINDOW_MS - (Date.now() - entry.first)) / 60000);
    return { allowed: false, retryInMinutes: Math.max(1, retry) };
  }
  return { allowed: true, retryInMinutes: 0 };
}

export function recordLoginFailure(key: string): void {
  const entry = attempts.get(key);
  if (!entry) {
    attempts.set(key, { count: 1, first: Date.now() });
    return;
  }
  entry.count += 1;
}

export function clearLoginFailures(key: string): void {
  attempts.delete(key);
}

/* ── Sessions ──────────────────────────────────────────────────────────────── */

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export async function createSession(
  user: UserRow,
  userAgent: string | null,
): Promise<void> {
  const token = crypto.randomBytes(32).toString("base64url");
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_TTL_DAYS * 864e5);

  run(
    `INSERT INTO sessions (token_hash, user_id, user_agent, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
    [sha256(token), user.id, userAgent, now.toISOString(), expires.toISOString()],
  );

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });

  // Opportunistic cleanup of expired sessions.
  run(`DELETE FROM sessions WHERE expires_at < ?`, [now.toISOString()]);
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    run(`DELETE FROM sessions WHERE token_hash = ?`, [sha256(token)]);
  }
  jar.delete(SESSION_COOKIE);
}

/** Resolves the current user from the session cookie. Never throws. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = one<{ user_id: string; expires_at: string }>(
    `SELECT user_id, expires_at FROM sessions WHERE token_hash = ?`,
    [sha256(token)],
  );
  if (!session) return null;
  if (new Date(session.expires_at).getTime() < Date.now()) return null;

  const user = findUserById(session.user_id);
  if (!user) return null;

  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

/** For pages and actions that must not render without an authenticated owner. */
export async function requireUser(redirectTo = "/admin/login"): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(redirectTo);
  return user;
}

/** Throws instead of redirecting — used inside mutation entry points. */
export async function assertUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function authenticate(
  email: string,
  password: string,
): Promise<UserRow | null> {
  const user = findUserByEmail(email);
  if (!user) {
    // Constant-ish work even for unknown emails to avoid trivial user probing.
    verifyPassword(password, hashPassword("dummy-password"));
    return null;
  }
  return verifyPassword(password, user.password_hash) ? user : null;
}
