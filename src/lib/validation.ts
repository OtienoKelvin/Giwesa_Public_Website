import { z } from "zod";

import { daysFromTodayInNairobi } from "@/lib/dates";

export const personNameSchema = z
  .string()
  .trim()
  .min(2, "Please enter your full name.")
  .max(80, "Name is too long.")
  .regex(
    /^[\p{L}\p{M}][\p{L}\p{M}' .-]*$/u,
    "Use letters, spaces, apostrophes, hyphens or full stops only.",
  );

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.")
  .max(254, "Email is too long.");

export const phoneSchema = z
  .string()
  .trim()
  .min(9, "Enter a valid phone number.")
  .max(24, "Phone number is too long.")
  .transform((value) => value.replace(/[\s()-]/g, ""))
  .refine((value) => /^\+?[0-9]{9,15}$/.test(value), "Enter a valid phone number.");

export const consentSchema = z.literal(true, {
  errorMap: () => ({ message: "Please confirm that you agree to be contacted." }),
});

export const honeypotSchema = z.string().max(0).optional().default("");

export const startedAtSchema = z
  .number({ invalid_type_error: "The form session is invalid." })
  .int()
  .positive();

export function isDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

export const preferredDateSchema = z
  .string()
  .refine(isDateOnly, "Choose a valid date.")
  .refine((value) => daysFromTodayInNairobi(value) >= 0, "Choose today or a future date.")
  .refine((value) => daysFromTodayInNairobi(value) <= 365, "Choose a date within the next year.");

export function fieldErrors(error: z.ZodError): Record<string, string[]> {
  return error.flatten().fieldErrors as Record<string, string[]>;
}
