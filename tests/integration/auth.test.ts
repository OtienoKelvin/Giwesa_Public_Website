import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { createAuthService } from "@/domains/auth/service";
import { hashPassword } from "@/domains/auth/password";
import { hashSessionToken } from "@/domains/auth/session-token";
import { prisma, resetDatabase } from "../helpers/db";

const auth = createAuthService(prisma);

async function createAdmin(options?: { status?: "ACTIVE" | "SUSPENDED"; email?: string }) {
  return prisma.adminUser.create({
    data: {
      name: "Test Administrator",
      email: options?.email ?? "admin@test.local",
      passwordHash: await hashPassword("CorrectPassword123!"),
      role: "ADMIN",
      status: options?.status ?? "ACTIVE",
    },
  });
}

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("admin authentication", () => {
  it("signs in with valid credentials and stores only a session hash", async () => {
    const admin = await createAdmin();
    const result = await auth.login("ADMIN@TEST.LOCAL", "CorrectPassword123!");

    expect(result.admin.id).toBe(admin.id);
    expect(result.admin.role).toBe("ADMIN");
    expect(result.token.length).toBeGreaterThan(30);

    const sessions = await prisma.session.findMany({ where: { userId: admin.id } });
    expect(sessions).toHaveLength(1);
    expect(sessions[0].tokenHash).toBe(hashSessionToken(result.token));
    expect(sessions[0].tokenHash).not.toContain(result.token);

    const refreshed = await prisma.adminUser.findUnique({ where: { id: admin.id } });
    expect(refreshed?.lastLoginAt).toBeInstanceOf(Date);
  });

  it("rejects an invalid password without revealing whether the account exists", async () => {
    await createAdmin();
    await expect(auth.login("admin@test.local", "WrongPassword123!")).rejects.toThrow(
      "Invalid email or password.",
    );
    await expect(auth.login("missing@test.local", "WrongPassword123!")).rejects.toThrow(
      "Invalid email or password.",
    );
  });

  it("rejects a suspended account", async () => {
    await createAdmin({ status: "SUSPENDED" });
    await expect(auth.login("admin@test.local", "CorrectPassword123!")).rejects.toThrow(
      "Invalid email or password.",
    );
  });

  it("resolves a live session and rejects it after expiry", async () => {
    await createAdmin();
    const result = await auth.login("admin@test.local", "CorrectPassword123!");
    expect(await auth.getAdminByToken(result.token)).toMatchObject({
      email: "admin@test.local",
      role: "ADMIN",
    });

    await prisma.session.updateMany({
      where: { tokenHash: hashSessionToken(result.token) },
      data: { expiresAt: new Date(Date.now() - 1_000) },
    });
    expect(await auth.getAdminByToken(result.token)).toBeNull();
  });

  it("logs out by deleting the database session", async () => {
    await createAdmin();
    const result = await auth.login("admin@test.local", "CorrectPassword123!");
    await auth.logout(result.token);
    expect(await auth.getAdminByToken(result.token)).toBeNull();
    expect(await prisma.session.count()).toBe(0);
  });

  it("changes a password, revokes sessions and requires the new password", async () => {
    await createAdmin();
    const result = await auth.login("admin@test.local", "CorrectPassword123!");
    await auth.changePassword(result.admin.id, "CorrectPassword123!", "NewCorrectPassword456!");

    expect(await auth.getAdminByToken(result.token)).toBeNull();
    await expect(auth.login("admin@test.local", "CorrectPassword123!")).rejects.toThrow();
    const next = await auth.login("admin@test.local", "NewCorrectPassword456!");
    expect(next.admin.email).toBe("admin@test.local");
  });
});
