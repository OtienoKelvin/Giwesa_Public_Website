import "server-only";

import { z } from "zod";

const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalText = z.preprocess(blankToUndefined, z.string().trim().optional());
const optionalUrl = z.preprocess(blankToUndefined, z.string().trim().url().optional());
const optionalEmail = z.preprocess(blankToUndefined, z.string().email().optional());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  SMTP_HOST: optionalText,
  SMTP_PORT: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).max(65535).optional()),
  SMTP_SECURE: z.preprocess(blankToUndefined, z.enum(["true", "false"]).optional()),
  SMTP_USER: optionalText,
  SMTP_PASSWORD: optionalText,
  SMTP_FROM_EMAIL: optionalEmail,
  SMTP_FROM_NAME: z.preprocess(blankToUndefined, z.string().trim().default("GIWESA Solutions")),
  NOTIFICATION_EMAIL: optionalEmail,

  MEDIA_ROOT: z.string().trim().default("public/uploads"),
  MEDIA_MAX_BYTES: z.preprocess(
    blankToUndefined,
    z.coerce
      .number()
      .int()
      .positive()
      .max(12 * 1024 * 1024)
      .default(4 * 1024 * 1024),
  ),

  // --- Membership registration (server-to-server, internal FMS) -------------
  // The public website does NOT own membership data. A public application is
  // submitted to the Giwesa Membership & Financial Management System through its
  // signed public channel, so this application needs only:
  //
  //   * the FMS base URL,
  //   * the shared channel key identifier,
  //   * the shared channel secret (a privileged credential: server-only, never
  //     NEXT_PUBLIC_, never sent to a browser).
  //
  // All optional, and EMPTY MEANS UNSET: an unconfigured deployment keeps today's
  // behaviour and the membership page reports that online registration is not
  // available instead of failing.
  FMS_API_URL: optionalUrl,
  FMS_CHANNEL_KEY: optionalText,
  FMS_CHANNEL_SECRET: optionalText,
  FMS_REQUEST_TIMEOUT_MS: z.preprocess(
    blankToUndefined,
    z.coerce.number().int().min(1_000).max(60_000).default(20_000),
  ),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join(".") || "environment"}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid environment configuration: ${details}`);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === "production";
export const siteUrl = env.APP_URL.replace(/\/+$/, "");

export function emailNotificationsConfigured(): boolean {
  return Boolean(env.SMTP_HOST && env.SMTP_FROM_EMAIL);
}

/**
 * Is the membership registration channel wired to the FMS?
 *
 * All three settings are needed: a URL with no credentials cannot be
 * authenticated, and credentials with no URL have nowhere to go. When this is
 * false the membership page shows a clear "not available online" state — it never
 * falls back to a local, second membership system.
 */
export function membershipIntegrationConfigured(): boolean {
  return Boolean(env.FMS_API_URL && env.FMS_CHANNEL_KEY && env.FMS_CHANNEL_SECRET);
}

export const publicEnv = {
  siteUrl,
} as const;
