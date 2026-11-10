import { randomUUID } from "node:crypto";

import {
  assertDeclaredBodySize,
  assertTrustedOrigin,
  maximumSubmissionBytes,
  membershipClientIp,
} from "@/domains/membership/http";
import { validateApplicantFile } from "@/domains/membership/files";
import {
  membershipApplicationSchema,
  type MembershipApplicationValues,
} from "@/domains/membership/schema";
import { submitMembership, type MembershipFiles } from "@/domains/membership/service";
import { RateLimitedError, ValidationError } from "@/lib/errors";
import { apiError, apiOk } from "@/lib/http";
import { createRateLimiter } from "@/lib/rate-limit";
import { fieldErrors } from "@/lib/validation";
import { logger } from "@/lib/logger";

/**
 * Public membership application submission.
 *
 * One multipart request carries the form (`payload` JSON) and the applicant's
 * documents. The route:
 *
 *   1. refuses a cross-site request and an oversized body;
 *   2. validates every field server-side with the SAME schema the form uses;
 *   3. validates each file by its content signature, not its name or declared type;
 *   4. forwards the application to the FMS over the signed channel;
 *   5. returns the application reference, the payment position and the applicant's
 *      access token (used for the payment step that follows).
 *
 * No membership data is stored here: the FMS is the system of record.
 */

const ipLimiter = createRateLimiter({ limit: 10, windowMs: 60 * 60 * 1000 });
const emailLimiter = createRateLimiter({ limit: 3, windowMs: 60 * 60 * 1000 });
const MIN_FORM_TIME_MS = 3_000;
const MAX_FORM_AGE_MS = 6 * 60 * 60 * 1000;

/** The server-side cap applied before anything is forwarded. */
const DEFAULT_MAX_FILE_BYTES = 5 * 1024 * 1024;

function readPayload(form: FormData): unknown {
  const raw = form.get("payload");
  if (typeof raw !== "string" || raw.length === 0) {
    throw new ValidationError("The application details were not received. Please try again.");
  }
  if (raw.length > 64_000) {
    throw new ValidationError("The application details are too large.");
  }
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new ValidationError("The application details could not be read. Please try again.");
  }
}

function filePart(form: FormData, name: string): FormDataEntryValue | null {
  const value = form.get(name);
  return value instanceof File && value.size > 0 ? value : null;
}

export async function POST(request: Request) {
  try {
    assertTrustedOrigin(request);

    const ip = membershipClientIp(request);
    const ipDecision = ipLimiter.consume(`membership:create:${ip}`);
    if (!ipDecision.allowed) {
      throw new RateLimitedError(
        "Too many membership applications from this connection. Please try again later.",
        ipDecision.retryAfterSeconds,
      );
    }

    // The whole request is bounded before it is buffered into memory.
    assertDeclaredBodySize(request, maximumSubmissionBytes(DEFAULT_MAX_FILE_BYTES));

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      throw new ValidationError("Please submit the form from the GIWESA website.");
    }

    const form = await request.formData();

    const parsed = membershipApplicationSchema.safeParse(readPayload(form));
    if (!parsed.success) {
      throw new ValidationError(
        "Please check the highlighted fields and try again.",
        fieldErrors(parsed.error),
      );
    }
    const values: MembershipApplicationValues = parsed.data;

    const elapsed = Date.now() - values.startedAt;
    // A honeypot hit is answered as though it had worked, so the form never
    // becomes a testing oracle; nothing is forwarded.
    if (values.company) {
      return apiOk({ ok: true, message: "Thank you. Your application has been received." }, 201);
    }
    if (elapsed < MIN_FORM_TIME_MS) {
      throw new ValidationError("Please take a moment to check your details and try again.");
    }
    if (elapsed > MAX_FORM_AGE_MS) {
      throw new ValidationError("This form has expired. Please refresh the page and try again.");
    }

    const emailDecision = emailLimiter.consume(`membership:email:${values.email}`);
    if (!emailDecision.allowed) {
      throw new RateLimitedError(
        "A membership application was submitted recently from this email address. Please wait before trying again.",
        emailDecision.retryAfterSeconds,
      );
    }

    const nationalIdFile = filePart(form, "nationalId");
    const photographFile = filePart(form, "photograph");
    if (!nationalIdFile || !photographFile) {
      const missing: Record<string, string[]> = {};
      if (!nationalIdFile) {
        missing.nationalId = ["Upload a copy of your National ID or passport."];
      }
      if (!photographFile) {
        missing.photograph = ["Upload a passport-size photograph of yourself."];
      }
      throw new ValidationError(
        "Upload both your National ID copy and a passport-size photograph.",
        missing,
      );
    }

    const nationalId = await validateApplicantFile({
      file: nationalIdFile as File,
      kind: "NATIONAL_ID",
      maxBytes: DEFAULT_MAX_FILE_BYTES,
      label: "Your National ID copy",
    });
    const photograph = await validateApplicantFile({
      file: photographFile as File,
      kind: "PASSPORT_PHOTO",
      maxBytes: DEFAULT_MAX_FILE_BYTES,
      label: "Your passport-size photograph",
    });
    const supportingFile = filePart(form, "supporting");
    const supporting = supportingFile
      ? await validateApplicantFile({
          file: supportingFile as File,
          kind: "SUPPORTING_DOCUMENT",
          maxBytes: DEFAULT_MAX_FILE_BYTES,
          label: "The supporting document",
        })
      : null;

    const files: MembershipFiles = { nationalId, photograph, supporting };

    // The submission key makes a double-click or a retry collapse into the same
    // FMS application. The form sends one; a fallback keeps a non-browser client
    // working (its retry would then be a separate application, which is why the
    // real form always supplies one).
    const suppliedKey = (form.get("idempotencyKey") ?? request.headers.get("idempotency-key")) as
      string | null;
    const idempotencyKey =
      typeof suppliedKey === "string" && /^[A-Za-z0-9._:-]{8,200}$/.test(suppliedKey)
        ? suppliedKey
        : `web-${randomUUID()}`;

    const { application, snapshot } = await submitMembership({
      values,
      files,
      idempotencyKey,
    });

    logger.info("Membership application submitted", {
      applicationNumber: snapshot.applicationNumber,
      paymentOption: snapshot.paymentOption,
      replayed: application.replayed,
    });

    return apiOk(
      {
        ok: true,
        application: {
          ...snapshot,
          token: application.token,
          tokenExpiresAt: application.tokenExpiresAt,
          // A replayed submission (retry/double-click) reports the SAME
          // application; the flag lets the page say so without implying a second.
          replayed: application.replayed,
        },
      },
      201,
    );
  } catch (error) {
    return apiError(error);
  }
}
