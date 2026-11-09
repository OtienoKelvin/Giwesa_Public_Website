import { createHash, createHmac } from "node:crypto";

/**
 * The client half of the public registration channel's request signature.
 *
 * Kept in its own module (no environment access, no `server-only`) so the
 * canonical string and the HMAC can be unit-tested directly. The FMS verifies
 * the exact same string; a change here must be mirrored there or every request
 * will be refused — which is exactly what the tests pin.
 *
 *     canonical = `${timestamp}\n${METHOD}\n${pathname}\n${bodyDigest}`
 *     signature = hex( HMAC-SHA256( secret, canonical ) )
 */

/** Digest marker used for a multipart upload (the boundary is HTTP-layer chosen). */
export const MULTIPART_BODY_DIGEST = "multipart";

export function sha256Hex(body: string): string {
  return createHash("sha256").update(body, "utf8").digest("hex");
}

export interface ChannelSignatureInput {
  secret: string;
  method: string;
  path: string;
  timestamp: string;
  bodyDigest: string;
}

export function canonicalChannelRequest(input: Omit<ChannelSignatureInput, "secret">): string {
  return [input.timestamp, input.method.toUpperCase(), input.path, input.bodyDigest].join("\n");
}

export function signChannelRequest(input: ChannelSignatureInput): string {
  return createHmac("sha256", input.secret)
    .update(canonicalChannelRequest(input), "utf8")
    .digest("hex");
}

/** The digest to sign for a request with this body (JSON) or multipart form. */
export function requestBodyDigest(body: string | null): string {
  if (body === null) return MULTIPART_BODY_DIGEST;
  return sha256Hex(body);
}
