import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import { UnauthorizedError } from "@/lib/errors";

import { hashPassword, verifyPassword } from "./password";
import { createSessionToken, hashSessionToken, SESSION_TTL_MS } from "./session-token";
import type { AuthenticatedAdmin } from "./types";

export type LoginMeta = {
  ipAddress?: string;
  userAgent?: string;
};

export function createAuthService(db: PrismaClient) {
  async function login(
    emailRaw: string,
    password: string,
    meta: LoginMeta = {},
  ): Promise<{ token: string; admin: AuthenticatedAdmin }> {
    const email = emailRaw.trim().toLowerCase();
    const user = await db.adminUser.findUnique({ where: { email } });
    const passwordMatches = user !== null && (await verifyPassword(user.passwordHash, password));

    if (!user || !passwordMatches || user.status !== "ACTIVE") {
      // One message for every failure, so this endpoint cannot be used to
      // discover which accounts exist.
      throw new UnauthorizedError("Invalid email or password.");
    }

    const token = createSessionToken();
    const now = new Date();
    await db.$transaction([
      db.session.create({
        data: {
          userId: user.id,
          tokenHash: hashSessionToken(token),
          expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
      }),
      db.adminUser.update({
        where: { id: user.id },
        data: { lastLoginAt: now },
      }),
    ]);

    return {
      token,
      admin: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }

  async function getAdminByToken(token: string): Promise<AuthenticatedAdmin | null> {
    const session = await db.session.findUnique({
      where: { tokenHash: hashSessionToken(token) },
      include: { user: true },
    });

    if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
      return null;
    }
    if (session.user.status !== "ACTIVE") return null;

    // Avoid a write on every page view. Recording activity every 15 minutes is
    // enough for a useful session list and keeps admin navigation fast.
    if (!session.lastUsedAt || session.lastUsedAt.getTime() < Date.now() - 15 * 60 * 1000) {
      await db.session
        .update({ where: { id: session.id }, data: { lastUsedAt: new Date() } })
        .catch(() => undefined);
    }

    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
    };
  }

  async function logout(token: string): Promise<void> {
    await db.session.deleteMany({ where: { tokenHash: hashSessionToken(token) } });
  }

  async function revokeAllSessions(userId: string): Promise<void> {
    await db.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async function changePassword(userId: string, current: string, next: string): Promise<void> {
    const user = await db.adminUser.findUnique({ where: { id: userId } });
    if (!user || !(await verifyPassword(user.passwordHash, current))) {
      throw new UnauthorizedError("Current password is incorrect.");
    }
    await db.adminUser.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(next) },
    });
    await revokeAllSessions(userId);
  }

  return { login, getAdminByToken, logout, revokeAllSessions, changePassword };
}

export type AuthService = ReturnType<typeof createAuthService>;
