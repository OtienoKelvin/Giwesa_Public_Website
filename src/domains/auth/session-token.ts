import { createHash, randomBytes } from "node:crypto";

export const SESSION_COOKIE_NAME = "giwesa_admin_session";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** A fresh 256-bit opaque token. Only its SHA-256 hash is persisted. */
export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
