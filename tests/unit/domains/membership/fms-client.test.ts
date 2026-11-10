import { afterEach, describe, expect, it, vi } from "vitest";

import {
  MembershipAccessError,
  MembershipConflictError,
  MembershipRejectedError,
  MembershipUnavailableError,
  createMembershipApplication,
  fetchMembershipConfig,
  initiateMembershipStk,
  uploadMembershipDocument,
} from "@/domains/membership/fms-client";
import {
  MULTIPART_BODY_DIGEST,
  requestBodyDigest,
  signChannelRequest,
} from "@/domains/membership/signing";

/**
 * The server-to-server client for the FMS.
 *
 * `fetch` is stubbed for every test: the website's test suite must never contact
 * a real membership service, and the assertions are about the CONTRACT — the
 * signature it sends, the headers it sets, and how the FMS's errors are translated
 * into messages a visitor can act on.
 */

const SECRET = "test-channel-secret-0123456789abcdef";
const KEY = "test-channel-key";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function captureFetch(response: Response | (() => Promise<Response>)) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init: init ?? {} });
      return typeof response === "function" ? response() : response;
    }),
  );
  return calls;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("membership FMS client", () => {
  it("signs a JSON request with the shared channel key and secret", async () => {
    const calls = captureFetch(
      jsonResponse(200, {
        success: true,
        data: {
          channelOpen: true,
          registrationFee: { amount: 550, currency: "KES", display: "KES 550.00" },
          paybill: "4098765",
          payLaterEnabled: true,
          stkEnabled: true,
          manualEnabled: true,
          documents: {
            mandatory: ["NATIONAL_ID"],
            optional: [],
            maxBytes: 1024,
            acceptedMimeTypes: [],
          },
          contact: { phone: "", email: "", website: "", address: "" },
        },
      }),
    );

    const config = await fetchMembershipConfig();
    expect(config.registrationFee.amount).toBe(550);

    expect(calls).toHaveLength(1);
    const { url, init } = calls[0];
    expect(url).toBe("https://fms.test/api/public/membership/config");
    const headers = init.headers as Record<string, string>;
    expect(headers["x-giwesa-channel-key"]).toBe(KEY);
    const timestamp = headers["x-giwesa-request-timestamp"];
    expect(Number(timestamp)).toBeGreaterThan(0);
    // The signature is exactly the protocol the FMS verifies.
    expect(headers["x-giwesa-request-signature"]).toBe(
      signChannelRequest({
        secret: SECRET,
        method: "GET",
        path: "/api/public/membership/config",
        timestamp,
        bodyDigest: requestBodyDigest(""),
      }),
    );
  });

  it("sends the idempotency key and the exact JSON body digest on create", async () => {
    const calls = captureFetch(
      jsonResponse(201, {
        success: true,
        data: {
          applicationId: "app-1",
          applicationNumber: "APP-00001",
          token: "token",
          tokenExpiresAt: "2026-12-08T00:00:00.000Z",
          replayed: false,
          paymentReference: "APP-00001-REG",
          status: "DRAFT",
          paymentOption: "STK_PUSH",
          paymentState: "UNPAID",
          submittedAt: null,
          createdAt: "2026-11-08T00:00:00.000Z",
          fee: { amount: 550, currency: "KES", paid: 0, outstanding: 550, satisfied: false },
          documents: [],
          stk: null,
          pdf: { available: false },
        },
      }),
    );

    const created = await createMembershipApplication({
      fields: { firstName: "Achieng" },
      idempotencyKey: "submission-key-123",
    });
    expect(created.applicationNumber).toBe("APP-00001");

    const { url, init } = calls[0];
    expect(url).toBe("https://fms.test/api/public/membership/applications");
    const body = init.body as string;
    expect(JSON.parse(body)).toEqual({ firstName: "Achieng" });
    const headers = init.headers as Record<string, string>;
    expect(headers["idempotency-key"]).toBe("submission-key-123");
    expect(headers["x-giwesa-request-signature"]).toBe(
      signChannelRequest({
        secret: SECRET,
        method: "POST",
        path: "/api/public/membership/applications",
        timestamp: headers["x-giwesa-request-timestamp"],
        bodyDigest: requestBodyDigest(body),
      }),
    );
  });

  it("signs a multipart upload with the multipart marker and carries the applicant token", async () => {
    const calls = captureFetch(
      jsonResponse(201, {
        success: true,
        data: {
          document: { id: "doc-1", documentType: "NATIONAL_ID", fileName: "id.jpg", sizeBytes: 10 },
        },
      }),
    );

    await uploadMembershipDocument({
      applicationId: "app-1",
      token: "applicant-token-value-123456",
      documentType: "NATIONAL_ID",
      fileName: "id.jpg",
      mimeType: "image/jpeg",
      data: Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
    });

    const { url, init } = calls[0];
    expect(url).toBe("https://fms.test/api/public/membership/applications/app-1/documents");
    const headers = init.headers as Record<string, string>;
    expect(headers["x-application-token"]).toBe("applicant-token-value-123456");
    expect(headers["content-type"]).toBeUndefined();
    expect(headers["x-giwesa-request-signature"]).toBe(
      signChannelRequest({
        secret: SECRET,
        method: "POST",
        path: "/api/public/membership/applications/app-1/documents",
        timestamp: headers["x-giwesa-request-timestamp"],
        bodyDigest: MULTIPART_BODY_DIGEST,
      }),
    );
  });

  it("translates a field-level rejection into the site's validation error", async () => {
    captureFetch(
      jsonResponse(422, {
        success: false,
        error: {
          code: "BUSINESS_RULE_VIOLATION",
          message: "These documents are required for an online application: National ID document",
          details: [{ path: ["documents"], message: "National ID document is required" }],
        },
      }),
    );

    await expect(
      createMembershipApplication({ fields: {}, idempotencyKey: "key-123456" }),
    ).rejects.toMatchObject({
      name: "MembershipRejectedError",
      fields: { documents: ["National ID document is required"] },
    });
    await expect(
      createMembershipApplication({ fields: {}, idempotencyKey: "key-123456" }),
    ).rejects.toBeInstanceOf(MembershipRejectedError);
  });

  it("translates a conflict into a state conflict, keeping the API's own wording", async () => {
    captureFetch(
      jsonResponse(409, {
        success: false,
        error: {
          code: "CONFLICT",
          message: "The registration fee for this application has already been paid",
        },
      }),
    );

    await expect(
      initiateMembershipStk({ applicationId: "app-1", token: "t".repeat(24), phone: "0712345678" }),
    ).rejects.toMatchObject({ name: "MembershipConflictError" });
    await expect(
      initiateMembershipStk({ applicationId: "app-1", token: "t".repeat(24), phone: "0712345678" }),
    ).rejects.toBeInstanceOf(MembershipConflictError);
  });

  it("reports 'unavailable' for an authentication failure, without leaking provider detail", async () => {
    captureFetch(
      jsonResponse(401, {
        success: false,
        error: { code: "UNAUTHENTICATED", message: "The request could not be authenticated" },
      }),
    );

    await expect(fetchMembershipConfig()).rejects.toBeInstanceOf(MembershipUnavailableError);
  });

  it("tells the applicant their own link is invalid (403) rather than 'unavailable'", async () => {
    captureFetch(
      jsonResponse(403, {
        success: false,
        error: { code: "FORBIDDEN", message: "This application link is not valid" },
      }),
    );

    await expect(
      initiateMembershipStk({ applicationId: "app-1", token: "t".repeat(24), phone: "0712345678" }),
    ).rejects.toMatchObject({ name: "MembershipAccessError", status: 401 });
    await expect(
      initiateMembershipStk({ applicationId: "app-1", token: "t".repeat(24), phone: "0712345678" }),
    ).rejects.toBeInstanceOf(MembershipAccessError);
  });

  it("reports 'unavailable' when the network call fails", async () => {
    captureFetch(() => Promise.reject(new TypeError("fetch failed")));
    await expect(fetchMembershipConfig()).rejects.toMatchObject({
      name: "MembershipUnavailableError",
    });
  });

  it("reports 'unavailable' when the FMS times out", async () => {
    captureFetch(() => {
      const error = new Error("The operation was aborted due to timeout");
      error.name = "TimeoutError";
      return Promise.reject(error);
    });
    await expect(fetchMembershipConfig()).rejects.toThrow(/took too long/i);
  });

  it("never includes the secret in an error or a response value", async () => {
    captureFetch(jsonResponse(500, { success: false, error: { message: "boom" } }));
    try {
      await fetchMembershipConfig();
      throw new Error("expected a rejection");
    } catch (error) {
      expect(String((error as Error).message)).not.toContain(SECRET);
      expect(JSON.stringify(error)).not.toContain(SECRET);
    }
  });
});
