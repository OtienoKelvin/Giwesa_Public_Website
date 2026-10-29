"use server";

import { redirect } from "next/navigation";

import { createAuditService } from "@/domains/audit/service";
import {
  auth,
  clearSessionCookie,
  readSessionToken,
  setSessionCookie,
} from "@/domains/auth/current";
import { loginSchema } from "@/domains/auth/schema";
import { prisma } from "@/db/client";
import { createRateLimiter } from "@/lib/rate-limit";
import { currentClientIp, safeNextPath } from "@/lib/request";
import type { ActionState } from "@/lib/action-state";

const loginLimiter = createRateLimiter({ limit: 8, windowMs: 10 * 60 * 1000 });
const loginIpLimiter = createRateLimiter({ limit: 20, windowMs: 10 * 60 * 1000 });
const audit = createAuditService(prisma);

export async function loginAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ip = await currentClientIp();
  const rawEmail = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const requestedNext = safeNextPath(String(formData.get("next") ?? ""));
  const next =
    requestedNext.startsWith("/admin") && !requestedNext.startsWith("/admin/login")
      ? requestedNext
      : "/admin";

  const ipLimit = loginIpLimiter.consume(`login-ip:${ip}`);
  if (!ipLimit.allowed) {
    return {
      status: "error",
      message: `Too many sign-in attempts from this connection. Try again in ${ipLimit.retryAfterSeconds} seconds.`,
    };
  }

  const parsed = loginSchema.safeParse({
    email: rawEmail,
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Enter a valid email address and password.",
      fields: parsed.error.flatten().fieldErrors,
    };
  }

  const key = `${ip}:${parsed.data.email}`;
  const limit = loginLimiter.consume(key);
  if (!limit.allowed) {
    return {
      status: "error",
      message: `Too many sign-in attempts. Try again in ${limit.retryAfterSeconds} seconds.`,
    };
  }

  let result;
  try {
    result = await auth.login(parsed.data.email, parsed.data.password, {
      ipAddress: ip,
      userAgent: "GIWESA public website admin",
    });
  } catch {
    // Deliberately identical for unknown accounts, bad passwords and suspended
    // accounts. The limiter has already counted this attempt.
    return {
      status: "error",
      message: "Invalid email or password.",
    };
  }

  loginLimiter.reset(key);
  await setSessionCookie(result.token);
  await audit.write({
    action: "auth:login",
    actorUserId: result.admin.id,
    entityType: "admin_user",
    entityId: result.admin.id,
    ipAddress: ip,
  });

  redirect(next);
}

export async function logoutAction(): Promise<void> {
  const token = await readSessionToken();
  if (token) {
    await auth.logout(token);
  }
  await clearSessionCookie();
  redirect("/admin/login");
}
