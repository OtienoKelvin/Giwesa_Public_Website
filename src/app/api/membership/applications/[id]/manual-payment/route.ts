import { z } from "zod";

import {
  assertTrustedOrigin,
  membershipClientIp,
  requireMembershipToken,
} from "@/domains/membership/http";
import { declareManualPayment } from "@/domains/membership/service";
import { ValidationError } from "@/lib/errors";
import { apiError, apiOk, readJson } from "@/lib/http";
import { createRateLimiter } from "@/lib/rate-limit";

/**
 * Record the applicant's manual-payment claim (the M-Pesa transaction code).
 *
 * Nothing is marked paid here: the FMS stores the claim as AWAITING MANUAL
 * VERIFICATION and the finance team reconciles it through the normal financial
 * process.
 */
const limiter = createRateLimiter({ limit: 6, windowMs: 10 * 60 * 1000 });

const bodySchema = z.object({
  mpesaCode: z
    .string()
    .trim()
    .min(6, "Enter the M-Pesa transaction code from your confirmation SMS.")
    .max(20, "The M-Pesa transaction code is too long.")
    .regex(/^[A-Za-z0-9]+$/, "Use only letters and numbers from the confirmation SMS."),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertTrustedOrigin(request);
    const { id } = await context.params;
    const ip = membershipClientIp(request);
    const decision = limiter.consume(`membership:manual:${ip}:${id}`);
    if (!decision.allowed) {
      throw new ValidationError(
        "Too many payment submissions. Please wait a few minutes and try again.",
      );
    }

    const token = requireMembershipToken(request);
    const parsed = bodySchema.safeParse(await readJson(request));
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? "Check the transaction code.");
    }

    const application = await declareManualPayment({
      applicationId: id,
      token,
      mpesaCode: parsed.data.mpesaCode,
    });
    return apiOk({ ok: true, application });
  } catch (error) {
    return apiError(error);
  }
}
