import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";

export type AuditEvent = {
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
  ipAddress?: string | null;
};

export function createAuditService(db: PrismaClient) {
  async function write(event: AuditEvent): Promise<void> {
    try {
      await db.auditLog.create({
        data: {
          actorUserId: event.actorUserId ?? null,
          action: event.action,
          entityType: event.entityType,
          entityId: event.entityId ?? null,
          metadata: event.metadata ? JSON.stringify(event.metadata) : null,
          ipAddress: event.ipAddress ?? null,
        },
      });
    } catch {
      // Audit logging must not break the user-facing operation. The failure is
      // logged without request contents or credentials.
      console.error("[audit] failed to write an audit event");
    }
  }

  return { write };
}

export type AuditService = ReturnType<typeof createAuditService>;
