import "server-only";

import { siteUrl } from "@/config/env";
import { ValidationError } from "@/lib/errors";
import { clientIpFromHeaders } from "@/lib/request";

/**
 * Small shared helpers for the membership API routes.
 *
 * Every route here is public and unauthenticated by cookie, so the protections
 * that apply are request-level: an origin check on mutations, a per-IP request
 * cap, a hard body-size ceiling and a header-carried applicant token for
 * operations on one application.
 */

/** Header carrying the applicant's application token (never a URL parameter). */
export const MEMBERSHIP_TOKEN_HEADER = "x-membership-token";

/** Maximum accepted size of the whole multipart submission. */
export function maximumSubmissionBytes(maxFileBytes: number): number {
  // Up to three files plus the JSON field and multipart overhead.
  return maxFileBytes * 3 + 256 * 1024;
}

/** The applicant token, or a 422 with a clear message. */
export function requireMembershipToken(request: Request): string {
  const token = request.headers.get(MEMBERSHIP_TOKEN_HEADER)?.trim() ?? "";
  if (!/^[A-Za-z0-9_-]{20,200}$/.test(token)) {
    throw new ValidationError("This application link is not valid. Please start again.");
  }
  return token;
}

/**
 * CSRF defence for a mutation.
 *
 * These endpoints carry no session cookie, so a cross-site request cannot act as
 * the visitor; the check still refuses a browser request whose `Origin` is a
 * different site, which blocks a third-party page from driving the form. A
 * request with no `Origin` (a non-browser client, or a same-origin navigation) is
 * allowed — requiring an origin header would break legitimate clients without
 * adding protection, because the endpoints carry no ambient authority.
 */
export function assertTrustedOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) return;
  try {
    if (new URL(origin).origin !== new URL(siteUrl).origin) {
      throw new ValidationError("This request did not come from the GIWESA website.");
    }
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new ValidationError("This request did not come from the GIWESA website.");
  }
}

/** Refuse an oversized body from the declared Content-Length before buffering. */
export function assertDeclaredBodySize(request: Request, maxBytes: number): void {
  const declared = Number(request.headers.get("content-length") ?? "");
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new ValidationError(
      "The files are too large to send together. Please use smaller files and try again.",
    );
  }
}

/** The caller's IP, for the request limiter and the log line. */
export function membershipClientIp(request: Request): string {
  return clientIpFromHeaders(request.headers);
}
