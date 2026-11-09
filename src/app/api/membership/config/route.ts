import { membershipChannelConfigured } from "@/domains/membership/fms-client";
import { membershipClientIp } from "@/domains/membership/http";
import { getMembershipConfig } from "@/domains/membership/service";
import { apiOk } from "@/lib/http";
import { createRateLimiter } from "@/lib/rate-limit";

// // 
/**
 * The registration fee, PayBill and payment options the form may offer.
 *
 * The values come from the FMS (the authority). When the channel is not
 * configured — or the FMS is briefly unreachable and nothing has been cached —
 * this answers `configured: false` rather than an error, so the page can explain
 * that online registration is unavailable instead of failing to render.
 */
const limiter = createRateLimiter({ limit: 90, windowMs: 10 * 60 * 1000 });

export async function GET(request: Request) {
  const ip = membershipClientIp(request);
  const decision = limiter.consume(`membership:config:${ip}`);
  if (!decision.allowed) {
    return Response.json(
      { ok: false, error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!membershipChannelConfigured()) {
    return apiOk({ ok: true, configured: false, config: null });
  }

  const config = await getMembershipConfig();
  if (!config) {
    return apiOk({ ok: true, configured: false, config: null });
  }

  return apiOk({ ok: true, configured: true, config });
}
