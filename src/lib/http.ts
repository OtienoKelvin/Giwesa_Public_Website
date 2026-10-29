import { NextResponse } from "next/server";

import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";

export function apiError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      { ok: false, error: error.message, fields: "fields" in error ? error.fields : undefined },
      {
        status: error.status,
        headers: {
          "Cache-Control": "no-store",
          ...("retryAfterSeconds" in error
            ? { "Retry-After": String(error.retryAfterSeconds) }
            : {}),
        },
      },
    );
  }
  logger.error("Unhandled API error");
  return NextResponse.json(
    { ok: false, error: "Something went wrong. Please try again." },
    { status: 500, headers: { "Cache-Control": "no-store" } },
  );
}

export function apiOk<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function readJson(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new AppError("Send this request as JSON.", 415, "unsupported_media_type");
  }
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 20_000) {
    throw new AppError("Request is too large.", 413, "payload_too_large");
  }
  try {
    return await request.json();
  } catch {
    throw new AppError("The request body is not valid JSON.", 400, "invalid_json");
  }
}
