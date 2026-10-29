import { hash as argon2Hash, verify as argon2Verify } from "@node-rs/argon2";

/**
 * Argon2id with OWASP-aligned parameters. Passwords and password-derived values
 * are never stored or logged in plaintext.
 */
const ARGON2_OPTIONS = {
  memorySize: 19_456,
  iterations: 2,
  parallelism: 1,
} as const;

export async function hashPassword(password: string): Promise<string> {
  return argon2Hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2Verify(hash, password);
  } catch {
    return false;
  }
}
