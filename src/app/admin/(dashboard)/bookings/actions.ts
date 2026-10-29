"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createAuditService } from "@/domains/audit/service";
import { requireLeadManagerApi } from "@/domains/auth/current";
import { getAdminBooking, updateBooking } from "@/domains/bookings/service";
import { prisma } from "@/db/client";
import type { ActionState } from "@/lib/action-state";
import { AppError } from "@/lib/errors";
import { currentClientIp } from "@/lib/request";

const audit = createAuditService(prisma);

const updateSchema = z.object({
  id: z.string().trim().min(1),
  status: z.enum(["NEW", "CONTACTED", "CONFIRMED", "COMPLETED", "CANCELLED"]),
  adminNotes: z.string().trim().max(3000).optional(),
});

export async function updateBookingAction(
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

  const existing = await getAdminBooking(parsed.data.id);
  if (!existing) return { status: "error", message: "That booking request could not be found." };

  await updateBooking(parsed.data.id, {
    status: parsed.data.status,
    adminNotes: parsed.data.adminNotes?.trim() || null,
  });

  await audit.write({
    action: "booking:status_changed",
    actorUserId: admin.id,
    entityType: "booking",
    entityId: parsed.data.id,
    metadata: { from: existing.status, to: parsed.data.status },
    ipAddress: await currentClientIp(),
  });

  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${parsed.data.id}`);
  return { status: "success", message: "Booking request updated." };
}
