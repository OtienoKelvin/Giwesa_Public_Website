import type { AdminRole } from "@/generated/prisma/client";

export type AuthenticatedAdmin = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
};

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  ADMIN: "Administrator",
  CONTENT_MANAGER: "Content manager",
};

export function isAdministrator(admin: Pick<AuthenticatedAdmin, "role">): boolean {
  return admin.role === "ADMIN";
}

export function canManageLeads(admin: Pick<AuthenticatedAdmin, "role">): boolean {
  return admin.role === "ADMIN";
}

export function canManageSettings(admin: Pick<AuthenticatedAdmin, "role">): boolean {
  return admin.role === "ADMIN";
}

export function canManageContent(admin: Pick<AuthenticatedAdmin, "role">): boolean {
  return admin.role === "ADMIN" || admin.role === "CONTENT_MANAGER";
}
