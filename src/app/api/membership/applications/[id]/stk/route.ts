import { z } from "zod";

import {
  assertTrustedOrigin,
  membershipClientIp,
  requireMembershipToken,
} from "@/domains/membership/http";
import { kenyanMobileSchema } from "@/domains/membership/schema";
import { startMembershipPayment } from "@/domains/membership/service";
import { apiError, apiOk, readJson } from "@/lib/http";
import { createRateLimiter } from "@/lib/rate-limit";
import { ValidationError } from "@/lib/errors";


/**
 * Initiate the M-Pesa STK Push for the registration fee.
 *
 * The amount is NOT accepted from the browser: the FMS sends its authoritative
 * configured fee, and the push is recorded against the application so the
 * provider's asynchronous result reaches it even if the applicant closes the tab.
 */
const limiter = createRateLimiter({ limit: 6, windowMs: 10 * 60 * 1000 });

const bodySchema = z.object({ phone: kenyanMobileSchema });

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    assertTrustedOrigin(request);
    const { id } = await context.params;
    const ip = membershipClientIp(request);
    const decision = limiter.consume(`membership:stk:${ip}:${id}`);
    if (!decision.allowed) {
      throw new ValidationError(
        "Too many payment attempts. Please wait a few minutes and try again.",
      );
    }

    const token = requireMembershipToken(request);
    const parsed = bodySchema.safeParse(await readJson(request));
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues[0]?.message ??
          "Enter the M-Pesa phone number that will receive the payment request.",
      );
    }

    const push = await startMembershipPayment({
      applicationId: id,
      token,
      phone: parsed.data.phone,
    });
    return apiOk({ ok: true, payment: push });
  } catch (error) {
    return apiError(error);
  }
}
