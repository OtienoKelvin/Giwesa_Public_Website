import "server-only";

import { z } from "zod";

const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalText = z.preprocess(blankToUndefined, z.string().trim().optional());
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

export const publicEnv = {
  siteUrl,
} as const;
