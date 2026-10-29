"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createAuditService } from "@/domains/audit/service";
import { requireLeadManagerApi } from "@/domains/auth/current";
import { getAdminInquiry, updateInquiry } from "@/domains/inquiries/service";
import { prisma } from "@/db/client";
import type { ActionState } from "@/lib/action-state";
import { AppError } from "@/lib/errors";
import { currentClientIp } from "@/lib/request";

const audit = createAuditService(prisma);

const updateSchema = z.object({
  id: z.string().trim().min(1),
  status: z.enum(["NEW", "CONTACTED", "RESOLVED", "ARCHIVED"]),
  adminNotes: z.string().trim().max(3000).optional(),
});

export async function updateInquiryAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let admin;
  try {
    admin = await requireLeadManagerApi();
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof AppError ? "Your session has expired. Sign in again." : "Unable to save.",
    };
  }

  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    adminNotes: formData.get("adminNotes") || undefined,
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the status and notes, then try again.",
      fields: parsed.error.flatten().fieldErrors,
    };
  }

  const existing = await getAdminInquiry(parsed.data.id);
  if (!existing) return { status: "error", message: "That inquiry could not be found." };

  await updateInquiry(parsed.data.id, {
    status: parsed.data.status,
    adminNotes: parsed.data.adminNotes?.trim() || null,
  });

  await audit.write({
    action: "inquiry:status_changed",
    actorUserId: admin.id,
    entityType: "inquiry",
    entityId: parsed.data.id,
    metadata: { from: existing.status, to: parsed.data.status },
    ipAddress: await currentClientIp(),
  });

  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${parsed.data.id}`);
  return { status: "success", message: "Inquiry updated." };
}
