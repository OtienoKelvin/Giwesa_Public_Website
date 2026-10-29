import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/db/client";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";

import { createAuthService } from "./service";
import { SESSION_COOKIE_NAME } from "./session-token";
import {
  canManageLeads,
  canManageSettings,
  isAdministrator,
  type AuthenticatedAdmin,
} from "./types";

const auth = createAuthService(prisma);

export async function readSessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE_NAME)?.value;
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(7 * 24 * 60 * 60),
    priority: "high",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Server-side source of truth for the current administrator. The session is
 * opaque and database-backed; the cookie never contains privileges.
 */
export const getCurrentAdmin = cache(async (): Promise<AuthenticatedAdmin | null> => {
  const token = await readSessionToken();
  if (!token) return null;
  return auth.getAdminByToken(token);
});

export async function requireAdminPage(): Promise<AuthenticatedAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function requireAdministratorPage(): Promise<AuthenticatedAdmin> {
  const admin = await requireAdminPage();
  if (!canManageSettings(admin)) redirect("/admin");
  return admin;
}

export async function requireLeadManagerPage(): Promise<AuthenticatedAdmin> {
  const admin = await requireAdminPage();
  if (!canManageLeads(admin)) redirect("/admin");
  return admin;
}

export async function requireAdminApi(): Promise<AuthenticatedAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) throw new UnauthorizedError();
  return admin;
}

export async function requireAdministratorApi(): Promise<AuthenticatedAdmin> {
  const admin = await requireAdminApi();
  if (!canManageSettings(admin)) throw new ForbiddenError();
  return admin;
}

export async function requireLeadManagerApi(): Promise<AuthenticatedAdmin> {
  const admin = await requireAdminApi();
  if (!canManageLeads(admin)) throw new ForbiddenError();
  return admin;
}

export function assertAdministrator(admin: AuthenticatedAdmin): void {
  if (!isAdministrator(admin)) throw new ForbiddenError();
}

export { auth };
