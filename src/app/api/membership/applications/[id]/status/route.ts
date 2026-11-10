import { requireMembershipToken, membershipClientIp } from "@/domains/membership/http";
import { getMembershipStatus } from "@/domains/membership/service";
import { apiError, apiOk } from "@/lib/http";
import { createRateLimiter } from "@/lib/rate-limit";

/**
 * The applicant's own application status.
 *
 * The token is sent as a header (never a query parameter) so it does not end up
 * in access logs or referrers. The response is the FMS's own snapshot, which is
 * the only place the payment position and the application status are decided.
 */
const limiter = createRateLimiter({ limit: 180, windowMs: 10 * 60 * 1000 });

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const decision = limiter.consume(`membership:status:${membershipClientIp(request)}:${id}`);
    if (!decision.allowed) {
      return Response.json(
        { ok: false, error: "Too many requests. Please wait a moment." },
        { status: 429, headers: { "Cache-Control": "no-store" } },
      );
    }
    const token = requireMembershipToken(request);
    const status = await getMembershipStatus({ applicationId: id, token });
    return apiOk({ ok: true, application: status });
  } catch (error) {
    return apiError(error);
  }
}
