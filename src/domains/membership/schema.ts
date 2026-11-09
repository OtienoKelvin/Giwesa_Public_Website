import { z } from "zod";

import { emailSchema, honeypotSchema, phoneSchema, startedAtSchema } from "@/lib/validation";
import { isDateOnly } from "@/lib/validation";

/**
 * The public membership application form.
 *
 * These rules mirror the membership application requirements the FMS enforces for
 * an internal capture — the SAME fields, the same name structure (First Name and
 * Surname required, Middle Name optional), the same enums — plus the requirements
 * that are specific to the public channel:
 *
 *   - an email address is mandatory (it is where the confirmation goes),
 *   - a National ID / passport number is mandatory,
 *   - a payment option must be chosen, and an STK Push needs a usable M-Pesa
 *     number,
 *   - the declaration must be accepted.
 *
 * The server re-validates everything: this schema is shared by the form (for
 * immediate feedback) and by the API route (as the authority).
 */

export const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
] as const;

export const MARITAL_OPTIONS = [
  { value: "SINGLE", label: "Single" },
  { value: "MARRIED", label: "Married" },
  { value: "DIVORCED", label: "Divorced" },
  { value: "WIDOWED", label: "Widowed" },
  { value: "OTHER", label: "Other" },
] as const;

/** The published form collects weekly or monthly savings (not daily). */
export const SAVINGS_FREQUENCY_OPTIONS = [
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
] as const;

export const PAYMENT_OPTIONS = ["STK_PUSH", "MANUAL", "PAY_LATER"] as const;
export type PaymentOption = (typeof PAYMENT_OPTIONS)[number];

export const PAYMENT_OPTION_COPY: Record<
  PaymentOption,
  { title: string; description: string }
> = {
  STK_PUSH: {
    title: "Pay now with M-Pesa",
    description:
      "We send a payment request to your phone. Enter your M-Pesa PIN to complete it.",
  },
  MANUAL: {
    title: "Pay by M-Pesa PayBill",
    description:
      "Pay from your phone using the PayBill number and the reference we generate for your application.",
  },
  PAY_LATER: {
    title: "Pay later",
    description:
      "Submit the application now and settle the registration fee later. Membership cannot be activated until it is paid.",
  },
};

/** Kenyan mobile number, normalised to `2547…` for the FMS. */
export const kenyanMobileSchema = z
  .string()
  .trim()
  .min(9, "Enter the M-Pesa phone number that will receive the payment request.")
  .max(20)
  .refine((value) => /^(?:\+?254|0)[17]\d{8}$/.test(value.replace(/[\s()-]/g, "")), {
    message: "Enter a valid Kenyan M-Pesa number, e.g. 0712345678 or +254712345678.",
  });

const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message).optional().default("");

const optionalPhone = z
  .string()
  .trim()
  .max(24)
  .optional()
  .default("")
  .refine((value) => value.length === 0 || /^\+?[0-9\s()-]{9,15}$/.test(value), {
    message: "Enter a valid phone number.",
  });

const optionalDateOfBirth = z
  .string()
  .trim()
  .optional()
  .default("")
  .refine((value) => value.length === 0 || isDateOnly(value), "Enter a valid date.")
  .refine((value) => {
    if (value.length === 0) return true;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    const today = new Date();
    return date.getTime() <= today.getTime();
  }, "Date of birth cannot be in the future.")
  .refine((value) => {
    if (value.length === 0) return true;
    return Number(value.slice(0, 4)) >= 1900;
  }, "Enter a date of birth after 1900.");

const optionalAmount = z
  .string()
  .trim()
  .optional()
  .default("")
  .refine((value) => value.length === 0 || /^\d{1,10}(\.\d{1,2})?$/.test(value), {
    message: "Enter an amount in shillings, e.g. 1000.",
  });

const optionalYears = z
  .string()
  .trim()
  .optional()
  .default("")
  .refine((value) => value.length === 0 || (/^\d{1,3}$/.test(value) && Number(value) <= 100), {
    message: "Enter a whole number of years between 0 and 100.",
  });

export const membershipApplicationSchema = z
  .object({
    // --- Personal --------------------------------------------------------
    firstName: z.string().trim().min(1, "First name is required.").max(80, "First name is too long."),
    middleName: z.string().trim().max(80, "Middle name is too long.").optional().default(""),
    surname: z.string().trim().min(1, "Surname is required.").max(80, "Surname is too long."),
    nationalId: z
      .string()
      .trim()
      .min(4, "Enter your National ID or passport number.")
      .max(32, "National ID / passport number is too long."),
    dateOfBirth: optionalDateOfBirth,
    gender: z.enum(["", "MALE", "FEMALE", "OTHER"]).optional().default(""),
    maritalStatus: z.enum(["", "SINGLE", "MARRIED", "DIVORCED", "WIDOWED", "OTHER"]).optional().default(""),
    occupation: optionalText(120, "Occupation is too long."),
    employerName: optionalText(200, "Employer name is too long."),

    // --- Contact & address ----------------------------------------------
    primaryPhone: phoneSchema,
    alternativePhone: optionalPhone,
    email: emailSchema,
    postalAddress: optionalText(255, "Postal address is too long."),
    county: optionalText(80, "County is too long."),
    subCounty: optionalText(80, "Sub-county is too long."),
    ward: optionalText(80, "Ward is too long."),
    villageEstate: optionalText(120, "Village or estate is too long."),

    // --- Next of kin ----------------------------------------------------
    nextOfKinName: optionalText(200, "Name is too long."),
    nextOfKinRelationship: optionalText(80, "Relationship is too long."),
    nextOfKinPhone: optionalPhone,
    nextOfKinPhysicalAddress: optionalText(255, "Address is too long."),

    // --- Business -------------------------------------------------------
    hasBusiness: z.boolean().optional().default(false),
    businessName: optionalText(200, "Business name is too long."),
    businessType: optionalText(120, "Business type is too long."),
    businessLocation: optionalText(200, "Business location is too long."),
    yearsInOperation: optionalYears,

    // --- Membership intent ----------------------------------------------
    savingsFrequency: z.enum(["", "WEEKLY", "MONTHLY"]).optional().default(""),
    expectedSavingsAmount: optionalAmount,

    // --- Payment --------------------------------------------------------
    paymentOption: z.enum(PAYMENT_OPTIONS, {
      errorMap: () => ({ message: "Choose how you would like to pay the registration fee." }),
    }),
    mpesaPhone: kenyanMobileSchema.optional().or(z.literal("")).default(""),

    // --- Declaration and anti-abuse -------------------------------------
    consent: z.literal(true, {
      errorMap: () => ({ message: "Please confirm the declaration to submit your application." }),
    }),
    company: honeypotSchema,
    startedAt: startedAtSchema,
  })
  .superRefine((value, ctx) => {
    if (value.hasBusiness && value.businessName.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["businessName"],
        message: "Enter the business name, or turn off the business section.",
      });
    }
    if (value.paymentOption === "STK_PUSH") {
      const result = kenyanMobileSchema.safeParse(value.mpesaPhone);
      if (!result.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["mpesaPhone"],
          message:
            result.error.issues[0]?.message ??
            "Enter the M-Pesa phone number that will receive the payment request.",
        });
      }
    }
  });

export type MembershipFormValues = z.input<typeof membershipApplicationSchema>;
export type MembershipApplicationValues = z.output<typeof membershipApplicationSchema>;

/** The field groups, in the order the form presents them. */
export const FORM_SECTIONS = [
  {
    id: "personal",
    title: "Personal details",
    description: "Tell us who you are, exactly as it appears on your ID.",
  },
  {
    id: "contact",
    title: "Contact and address",
    description: "How we reach you, and where you live.",
  },
  {
    id: "kin",
    title: "Next of kin",
    description: "Someone we can contact in an emergency. Optional, but helpful.",
  },
  {
    id: "business",
    title: "Business or enterprise",
    description: "Only if you run a business or trade of your own.",
  },
  {
    id: "savings",
    title: "Savings intention",
    description: "How you would like to save with GIWESA.",
  },
  {
    id: "documents",
    title: "Documents",
    description: "Your National ID copy and a passport-size photograph are required.",
  },
  {
    id: "payment",
    title: "Registration fee",
    description: "Choose how you would like to pay the one-off registration fee.",
  },
  {
    id: "review",
    title: "Review and submit",
    description: "Check your details, accept the declaration and submit.",
  },
] as const;
