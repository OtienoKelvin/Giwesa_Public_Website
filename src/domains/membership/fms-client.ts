import "server-only";

import { env, membershipIntegrationConfigured } from "@/config/env";
import {
  type CreatedMembershipApplication,
  type MembershipApplicationSnapshot,
  type MembershipChannelConfig,
  type StkInitiation,
} from "@/domains/membership/types";
import {
  MULTIPART_BODY_DIGEST,
  requestBodyDigest,
  signChannelRequest,
} from "@/domains/membership/signing";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";

/**
 * Server-to-server client for the Giwesa Membership & Financial Management
 * System's PUBLIC registration channel.
 *
 * The public website does not hold a second membership database and does not
 * implement membership rules of its own: every application it accepts is created,
 * documented and submitted through the FMS, using the FMS's own services. This
 * module is the only place the website talks to it.
 *
 * ## Authentication
 *
 * Requests are signed with the shared channel secret:
 *
 *     canonical = `${timestamp}\n${METHOD}\n${pathname}\n${bodyDigest}`
 *     signature = hex( HMAC-SHA256( secret, canonical ) )
 *
 * A JSON body signs the SHA-256 of the exact bytes sent. A multipart upload signs
 * the literal marker `multipart` (the HTTP layer chooses the boundary, so the
 * sender cannot hash the final bytes); the file itself is then constrained by the
 * FMS's content-signature, type and size validation and by the applicant token.
 *
 * The secret is read from the server environment and never leaves this process:
 * nothing here is imported by a Client Component, and there is no `NEXT_PUBLIC_`
 * variable anywhere in this module.
 */

const HEADERS = {
  key: "x-giwesa-channel-key",
  timestamp: "x-giwesa-request-timestamp",
  signature: "x-giwesa-request-signature",
  token: "x-application-token",
  idempotency: "idempotency-key",
} as const;

export type {
  CreatedMembershipApplication,
  MembershipApplicationSnapshot,
  MembershipChannelConfig,
  PaymentOptionValue,
  PaymentStateValue,
  StkInitiation,
} from "@/domains/membership/types";

/** The channel is not configured on this deployment, or the FMS is unreachable. */
export class MembershipUnavailableError extends AppError {
  constructor(
    message = "Online membership registration is not available at the moment. Please contact the GIWESA office.",
  ) {
    super(message, 503, "membership_unavailable");
    this.name = "MembershipUnavailableError";
  }
}

/** The FMS refused the request because of the submitted data. */
export class MembershipRejectedError extends AppError {
  constructor(message: string, fields?: Record<string, string[]>) {
    super(message, 422, "membership_rejected");
    this.name = "MembershipRejectedError";
    this.fields = fields;
  }

  readonly fields?: Record<string, string[]>;
}

/** The FMS refused because of the application's current state. */
export class MembershipConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "membership_conflict");
    this.name = "MembershipConflictError";
  }
}

/**
 * The application link is not valid (wrong or expired token).
 *
 * Deliberately distinct from `MembershipUnavailableError`: the visitor's link is
 * the problem, not the site's integration, and the two get different advice.
 */
export class MembershipAccessError extends AppError {
  constructor(message = "This application link is not valid. Please contact the GIWESA office.") {
    super(message, 401, "membership_access_denied");
    this.name = "MembershipAccessError";
  }
}

export function membershipChannelConfigured(): boolean {
  return membershipIntegrationConfigured();
}

function requireConfiguration(): { baseUrl: string; key: string; secret: string } {
  if (!membershipIntegrationConfigured()) {
    throw new MembershipUnavailableError();
  }
  return {
    baseUrl: (env.FMS_API_URL ?? "").replace(/\/+$/, ""),
    key: env.FMS_CHANNEL_KEY as string,
    secret: env.FMS_CHANNEL_SECRET as string,
  };
}

/** Hex SHA-256 of the exact bytes sent. */

interface FmsEnvelope {
  success?: boolean;
  data?: unknown;
  error?: { code?: string; message?: string; details?: unknown };
}

/** Turn the FMS's field-issue list into the shape this site's API returns. */
function toFieldErrors(details: unknown): Record<string, string[]> | undefined {
  if (!Array.isArray(details)) return undefined;
  const fields: Record<string, string[]> = {};
  for (const detail of details) {
    if (
      typeof detail !== "object" ||
      detail === null ||
      !("path" in detail) ||
      !("message" in detail)
    ) {
      continue;
    }
    const path = (detail as { path?: unknown }).path;
    const message = (detail as { message?: unknown }).message;
    if (
      !Array.isArray(path) ||
      path.length === 0 ||
      typeof message !== "string" ||
      message.length === 0
    ) {
      continue;
    }
    const key = String(path[0]);
    fields[key] = [...(fields[key] ?? []), message];
  }
  return Object.keys(fields).length > 0 ? fields : undefined;
}

function isTimeout(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "TimeoutError" ||
      error.name === "AbortError" ||
      /timed? ?out|aborted/i.test(error.message))
  );
}

export interface FmsRequestOptions {
  method: "GET" | "POST";
  /** The FMS pathname — it is part of the signature, so it must be exact. */
  path: string;
  /** Serialized JSON body. */
  body?: string;
  /** Multipart body (uploads). Mutually exclusive with `body`. */
  multipart?: FormData;
  applicationToken?: string;
  idempotencyKey?: string;
  /** A short, safe description for the log line (never includes body content). */
  operation: string;
}

/**
 * Perform one signed request and return the unwrapped `data`.
 *
 * Errors are translated into the public site's own error types so the API routes
 * and the form never see FMS internals, a stack trace or a credential.
 */
async function request<T>(options: FmsRequestOptions): Promise<T> {
  const { baseUrl, key, secret } = requireConfiguration();
  const timestamp = String(Date.now());
  const digest = options.multipart ? MULTIPART_BODY_DIGEST : requestBodyDigest(options.body ?? "");
  const signature = signChannelRequest({
    secret,
    method: options.method,
    path: options.path,
    timestamp,
    bodyDigest: digest,
  });

  const headers: Record<string, string> = {
    [HEADERS.key]: key,
    [HEADERS.timestamp]: timestamp,
    [HEADERS.signature]: signature,
    accept: "application/json",
  };
  if (options.operation) headers["x-giwesa-operation"] = options.operation.slice(0, 64);
  if (options.applicationToken) headers[HEADERS.token] = options.applicationToken;
  if (options.idempotencyKey) headers[HEADERS.idempotency] = options.idempotencyKey;
  if (options.body !== undefined) headers["content-type"] = "application/json";

  let response: Response;
  try {
    // A GET/HEAD request must not carry a body: passing `""` is still a body to
    // the fetch implementation and is rejected before the request is sent.
    const hasBody = options.multipart !== undefined || (options.body ?? "").length > 0;
    response = await fetch(`${baseUrl}${options.path}`, {
      method: options.method,
      headers,
      ...(hasBody ? { body: options.multipart ?? options.body } : {}),
      // Never follow a redirect with a signed, credentialed request: a redirect
      // would send the signature to a different endpoint than the one signed.
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(env.FMS_REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    logger.error("Membership service request failed", {
      operation: options.operation,
      reason: isTimeout(error) ? "timeout" : "network",
    });
    throw new MembershipUnavailableError(
      isTimeout(error)
        ? "The membership service took too long to respond. Please try again."
        : "The membership service could not be reached. Please check your connection and try again.",
    );
  }

  let payload: FmsEnvelope | null = null;
  try {
    payload = (await response.json()) as FmsEnvelope;
  } catch {
    payload = null;
  }

  if (!response.ok || payload?.success === false) {
    // Log the CODE and the HTTP status only: the message may quote the applicant's
    // data, and the request body is never logged.
    logger.warn("Membership service rejected a request", {
      operation: options.operation,
      status: response.status,
      code: payload?.error?.code ?? null,
    });

    if (response.status === 401) {
      // The CHANNEL credentials were refused: an operator problem, not the
      // applicant's. Never leak the provider's wording.
      throw new MembershipUnavailableError(
        "Online membership registration is not available at the moment. Please contact the GIWESA office.",
      );
    }
    if (response.status === 403) {
      // The channel proved itself; THIS application link is not usable.
      throw new MembershipAccessError(
        payload?.error?.message ??
          "This application link is not valid or has expired. Please contact the GIWESA office.",
      );
    }
    if (response.status === 503 || response.status === 502) {
      throw new MembershipUnavailableError();
    }
    if (response.status === 409) {
      throw new MembershipConflictError(
        payload?.error?.message ??
          "A membership application with these details is already being processed. Contact the GIWESA office if you need to make a change.",
      );
    }
    if (response.status === 400 || response.status === 422) {
      throw new MembershipRejectedError(
        payload?.error?.message ?? "Please check the details you entered and try again.",
        toFieldErrors(payload?.error?.details),
      );
    }
    throw new MembershipUnavailableError(
      "The membership service could not process the request. Please try again.",
    );
  }

  return payload?.data as T;
}

/** The channel configuration (fee, PayBill, available payment options). */
export async function fetchMembershipConfig(): Promise<MembershipChannelConfig> {
  return request<MembershipChannelConfig>({
    method: "GET",
    path: "/api/public/membership/config",
    body: "",
    operation: "config",
  });
}

/**
 * Upload one applicant document.
 *
 * `file` is passed straight through as a Blob: the website never decodes, renames
 * or re-encodes the applicant's ID, and the FMS decides what the bytes really are.
 */
export async function uploadMembershipDocument(options: {
  applicationId: string;
  token: string;
  documentType: "NATIONAL_ID" | "PASSPORT_PHOTO" | "SUPPORTING_DOCUMENT";
  fileName: string;
  mimeType: string;
  data: Buffer;
}): Promise<{ id: string; documentType: string; fileName: string; sizeBytes: number }> {
  const path = `/api/public/membership/applications/${encodeURIComponent(
    options.applicationId,
  )}/documents`;
  const form = new FormData();
  form.set("documentType", options.documentType);
  form.set(
    "file",
    new Blob([new Uint8Array(options.data)], { type: options.mimeType }),
    options.fileName,
  );
  return request({
    method: "POST",
    path,
    multipart: form,
    applicationToken: options.token,
    operation: `upload:${options.documentType}`,
  });
}

/** Create the draft application. `idempotencyKey` makes a retry safe. */
export async function createMembershipApplication(options: {
  fields: Record<string, unknown>;
  idempotencyKey: string;
}): Promise<CreatedMembershipApplication> {
  return request<CreatedMembershipApplication>({
    method: "POST",
    path: "/api/public/membership/applications",
    body: JSON.stringify(options.fields),
    idempotencyKey: options.idempotencyKey,
    operation: "create",
  });
}

/** Submit the application into the membership pipeline. */
export async function submitMembershipApplication(options: {
  applicationId: string;
  token: string;
}): Promise<MembershipApplicationSnapshot> {
  return request<MembershipApplicationSnapshot>({
    method: "POST",
    path: `/api/public/membership/applications/${encodeURIComponent(options.applicationId)}/submit`,
    body: "{}",
    applicationToken: options.token,
    operation: "submit",
  });
}

/** The applicant's own application status and payment position. */
export async function fetchMembershipStatus(options: {
  applicationId: string;
  token: string;
}): Promise<MembershipApplicationSnapshot> {
  return request<MembershipApplicationSnapshot>({
    method: "GET",
    path: `/api/public/membership/applications/${encodeURIComponent(options.applicationId)}/status`,
    body: "",
    applicationToken: options.token,
    operation: "status",
  });
}

/** Ask the FMS to send an M-Pesa STK Push for the registration fee. */
export async function initiateMembershipStk(options: {
  applicationId: string;
  token: string;
  phone: string;
}): Promise<StkInitiation> {
  return request<StkInitiation>({
    method: "POST",
    path: `/api/public/membership/applications/${encodeURIComponent(options.applicationId)}/stk`,
    body: JSON.stringify({ phone: options.phone }),
    applicationToken: options.token,
    operation: "stk",
  });
}

/** Declare a manual PayBill payment (a claim; finance still verifies it). */
export async function declareMembershipManualPayment(options: {
  applicationId: string;
  token: string;
  mpesaCode: string;
}): Promise<MembershipApplicationSnapshot> {
  return request<MembershipApplicationSnapshot>({
    method: "POST",
    path: `/api/public/membership/applications/${encodeURIComponent(
      options.applicationId,
    )}/manual-payment`,
    body: JSON.stringify({ mpesaCode: options.mpesaCode }),
    applicationToken: options.token,
    operation: "manual-payment",
  });
}
