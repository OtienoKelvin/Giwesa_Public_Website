import { describe, expect, it } from "vitest";

import {
  MULTIPART_BODY_DIGEST,
  canonicalChannelRequest,
  requestBodyDigest,
  sha256Hex,
  signChannelRequest,
} from "@/domains/membership/signing";

/**
 * The client half of the membership channel signature.
 *
 * The canonical string is a protocol, so these tests pin it exactly: a change
 * here that is not mirrored by the FMS verifier would refuse every request, and a
 * change that made the signature weaker would be caught here rather than in
 * production.
 */

const SECRET = "test-channel-secret-0123456789abcdef";

describe("membership channel request signing", () => {
  it("builds the documented canonical string", () => {
    expect(
      canonicalChannelRequest({
        method: "post",
        path: "/api/public/membership/applications",
        timestamp: "1766000000000",
        bodyDigest: "abc123",
      }),
    ).toBe("1766000000000\nPOST\n/api/public/membership/applications\nabc123");
  });

  it("is deterministic for the same inputs", () => {
    const input = {
      secret: SECRET,
      method: "POST" as const,
      path: "/api/public/membership/applications/x/submit",
      timestamp: "1766000000000",
      bodyDigest: sha256Hex("{}"),
    };
    expect(signChannelRequest(input)).toBe(signChannelRequest(input));
    expect(signChannelRequest(input)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("changes when the method, path, body or secret changes", () => {
    const base = {
      secret: SECRET,
      method: "POST" as const,
      path: "/api/public/membership/applications",
      timestamp: "1766000000000",
      bodyDigest: sha256Hex('{"firstName":"A"}'),
    };
    const signature = signChannelRequest(base);
    expect(signChannelRequest({ ...base, method: "GET" })).not.toBe(signature);
    expect(signChannelRequest({ ...base, path: "/api/public/membership/config" })).not.toBe(
      signature,
    );
    expect(signChannelRequest({ ...base, bodyDigest: sha256Hex('{"firstName":"B"}') })).not.toBe(
      signature,
    );
    expect(signChannelRequest({ ...base, secret: `${SECRET}-other` })).not.toBe(signature);
  });

  it("signs the sha-256 of a JSON body and the multipart marker for an upload", () => {
    expect(requestBodyDigest("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
    expect(requestBodyDigest(null)).toBe(MULTIPART_BODY_DIGEST);
    expect(MULTIPART_BODY_DIGEST).toBe("multipart");
  });
});
