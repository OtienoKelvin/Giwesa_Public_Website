import { after } from "next/server";

import { sendNewInquiryNotification } from "@/domains/email/service";
import { createInquiry } from "@/domains/inquiries/service";
import { inquirySchema } from "@/domains/inquiries/schema";
import { createRateLimiter } from "@/lib/rate-limit";
import { clientIpFromHeaders } from "@/lib/request";
import { RateLimitedError, ValidationError } from "@/lib/errors";
import { apiError, apiOk, readJson } from "@/lib/http";
import { fieldErrors } from "@/lib/validation";

const ipLimiter = createRateLimiter({ limit: 6, windowMs: 10 * 60 * 1000 });
const emailLimiter = createRateLimiter({ limit: 3, windowMs: 10 * 60 * 1000 });
const MIN_FORM_TIME_MS = 1200;
const MAX_FORM_AGE_MS = 2 * 60 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const ip = clientIpFromHeaders(request.headers);
    const ipLimit = ipLimiter.consume(`inquiry:${ip}`);
    if (!ipLimit.allowed) {
      throw new RateLimitedError(
        "Too many inquiries from this connection. Please try again later.",
        ipLimit.retryAfterSeconds,
      );
    }

    const body = await readJson(request);
    const parsed = inquirySchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(
        "Please check the highlighted fields and try again.",
        fieldErrors(parsed.error),
      );
    }

    const input = parsed.data;
    const elapsed = Date.now() - input.startedAt;

    // Honeypot hits receive a generic success response so the form does not
    // become a testing oracle. Nothing is persisted.
    if (input.company) {
      return apiOk({ ok: true, message: "Thank you. Your inquiry has been received." }, 201);
    }
    if (elapsed < MIN_FORM_TIME_MS) {
      throw new ValidationError("Please take a moment to check your message and try again.");
    }
    if (elapsed > MAX_FORM_AGE_MS) {
      throw new ValidationError("This form has expired. Please refresh the page and try again.");
    }

    const emailLimit = emailLimiter.consume(`inquiry:email:${input.email}`);
    if (!emailLimit.allowed) {
      throw new RateLimitedError(
        "An inquiry was sent recently from this email address. Please wait before trying again.",
        emailLimit.retryAfterSeconds,
      );
    }

    const inquiry = await createInquiry(input);
    after(() => sendNewInquiryNotification(inquiry));

    return apiOk(
      {
        ok: true,
        message: "Thank you. Your inquiry has been received.",
      },
      201,
    );
  } catch (error) {
    return apiError(error);
  }
}
