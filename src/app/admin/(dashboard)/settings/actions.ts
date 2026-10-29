"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createAuditService } from "@/domains/audit/service";
import {
  auth,
  clearSessionCookie,
  requireAdministratorApi,
  requireAdminApi,
} from "@/domains/auth/current";
import { settingsSchema, updateSiteSettings } from "@/domains/site-settings/service";
import { prisma } from "@/db/client";
import type { ActionState } from "@/lib/action-state";
import { AppError } from "@/lib/errors";
import { currentClientIp } from "@/lib/request";

const audit = createAuditService(prisma);

export async function saveSettingsAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let admin;
  try {
    admin = await requireAdministratorApi();
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof AppError
          ? "Your session has expired or you do not have permission."
          : "Unable to save.",
    };
  }

  const parsed = settingsSchema.safeParse({
    phone: formData.get("phone"),
    email: formData.get("email"),
    address: formData.get("address"),
    officeHours: formData.get("officeHours") || undefined,
    facebookUrl: formData.get("facebookUrl") ?? "",
    instagramUrl: formData.get("instagramUrl") ?? "",
    linkedinUrl: formData.get("linkedinUrl") ?? "",
    xUrl: formData.get("xUrl") ?? "",
    heroEyebrow: formData.get("heroEyebrow"),
    heroTitle: formData.get("heroTitle"),
    heroDescription: formData.get("heroDescription"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields and try again.",
      fields: parsed.error.flatten().fieldErrors,
    };
  }

  await updateSiteSettings(parsed.data, admin.id);
  await audit.write({
    action: "site_setting:updated",
    actorUserId: admin.id,
    entityType: "site_setting",
    entityId: "1",
    metadata: { fields: "contact, social, hero" },
    ipAddress: await currentClientIp(),
  });

  updateTag("site-settings");
  revalidatePath("/");
  revalidatePath("/contact");
  revalidatePath("/about");
  revalidatePath("/book");
  revalidatePath("/solutions");
  return { status: "success", message: "Website settings saved." };
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z
      .string()
      .min(12, "Use at least 12 characters.")
      .max(128, "Password is too long.")
      .regex(/[A-Za-z]/, "Include at least one letter.")
      .regex(/[0-9]/, "Include at least one number."),
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "The new passwords do not match.",
  });

export async function changePasswordAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let admin;
  try {
    admin = await requireAdminApi();
  } catch {
    return { status: "error", message: "Your session has expired. Sign in again." };
  }

  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the password fields and try again.",
      fields: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await auth.changePassword(admin.id, parsed.data.currentPassword, parsed.data.newPassword);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof AppError ? error.message : "The password could not be changed.",
    };
  }

  await audit.write({
    action: "admin:password_changed",
    actorUserId: admin.id,
    entityType: "admin_user",
    entityId: admin.id,
    ipAddress: await currentClientIp(),
  });
  await clearSessionCookie();
  redirect("/admin/login?changed=1");
}
