import { describe, expect, it } from "vitest";

import {
  membershipApplicationSchema,
  PAYMENT_OPTIONS,
} from "@/domains/membership/schema";

/**
 * The public form's validation.
 *
 * The rules mirror the membership application requirements the FMS enforces, and
 * add the public channel's own: an email address, a National ID number, a payment
 * option (with an M-Pesa number for the STK option) and the declaration.
 */

const VALID = {
  firstName: "Achieng",
  middleName: "Mary",
  surname: "Otieno",
  nationalId: "33998877",
  dateOfBirth: "1990-04-12",
  gender: "FEMALE" as const,
  maritalStatus: "MARRIED" as const,
  occupation: "Trader",
  employerName: "",
  primaryPhone: "0712345678",
  alternativePhone: "",
  email: "achieng@example.com",
  postalAddress: "P.O. Box 12, Homa Bay",
  county: "Homa Bay",
  subCounty: "Homa Bay Town",
  ward: "Central",
  villageEstate: "Salama",
  nextOfKinName: "John Otieno",
  nextOfKinRelationship: "Spouse",
  nextOfKinPhone: "0711222333",
  nextOfKinPhysicalAddress: "",
  hasBusiness: false,
  businessName: "",
  businessType: "",
  businessLocation: "",
  yearsInOperation: "",
  savingsFrequency: "MONTHLY" as const,
  expectedSavingsAmount: "1000",
  paymentOption: "STK_PUSH" as const,
  mpesaPhone: "0712345678",
  consent: true as const,
  company: "",
  startedAt: 1_766_000_000_000,
};

function errorsFor(overrides: Record<string, unknown>): string[] {
  const result = membershipApplicationSchema.safeParse({ ...VALID, ...overrides });
  if (result.success) return [];
  return result.error.issues.map((issue) => issue.path.join("."));
}

describe("public membership application schema", () => {
  it("accepts a complete application", () => {
    const result = membershipApplicationSchema.safeParse(VALID);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.paymentOption).toBe("STK_PUSH");
    expect(result.data.email).toBe("achieng@example.com");
  });

  it("requires the applicant's name components", () => {
    expect(errorsFor({ firstName: "" })).toContain("firstName");
    expect(errorsFor({ surname: "" })).toContain("surname");
    // Middle name is optional.
    expect(errorsFor({ middleName: "" })).toEqual([]);
  });

  it("requires an email address (the confirmation has nowhere else to go)", () => {
    expect(errorsFor({ email: "" })).toContain("email");
    expect(errorsFor({ email: "not-an-email" })).toContain("email");
  });

  it("requires a National ID / passport number", () => {
    expect(errorsFor({ nationalId: "" })).toContain("nationalId");
    expect(errorsFor({ nationalId: "1" })).toContain("nationalId");
  });

  it("requires a usable primary phone number", () => {
    expect(errorsFor({ primaryPhone: "" })).toContain("primaryPhone");
    expect(errorsFor({ primaryPhone: "abc" })).toContain("primaryPhone");
  });

  it("requires the declaration to be accepted", () => {
    expect(errorsFor({ consent: false })).toContain("consent");
  });

  it("requires an M-Pesa number only when paying by STK Push", () => {
    expect(errorsFor({ paymentOption: "STK_PUSH", mpesaPhone: "" })).toContain("mpesaPhone");
    expect(errorsFor({ paymentOption: "STK_PUSH", mpesaPhone: "123" })).toContain("mpesaPhone");
    expect(errorsFor({ paymentOption: "MANUAL", mpesaPhone: "" })).toEqual([]);
    expect(errorsFor({ paymentOption: "PAY_LATER", mpesaPhone: "" })).toEqual([]);
  });

  it("accepts the three documented payment options only", () => {
    expect(PAYMENT_OPTIONS).toEqual(["STK_PUSH", "MANUAL", "PAY_LATER"]);
    expect(errorsFor({ paymentOption: "CASH" })).toContain("paymentOption");
  });

  it("requires a business name when a business is declared", () => {
    expect(errorsFor({ hasBusiness: true, businessName: "" })).toContain("businessName");
    expect(errorsFor({ hasBusiness: true, businessName: "Otieno Groceries" })).toEqual([]);
  });

  it("rejects a date of birth in the future or before 1900", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    expect(errorsFor({ dateOfBirth: future.toISOString().slice(0, 10) })).toContain("dateOfBirth");
    expect(errorsFor({ dateOfBirth: "1899-12-31" })).toContain("dateOfBirth");
    expect(errorsFor({ dateOfBirth: "not-a-date" })).toContain("dateOfBirth");
    expect(errorsFor({ dateOfBirth: "" })).toEqual([]);
  });

  it("rejects malformed optional amounts and years", () => {
    expect(errorsFor({ expectedSavingsAmount: "abc" })).toContain("expectedSavingsAmount");
    expect(errorsFor({ yearsInOperation: "101", hasBusiness: true, businessName: "Shop" })).toContain(
      "yearsInOperation",
    );
  });

  it("rejects a filled honeypot", () => {
    expect(errorsFor({ company: "spam" })).toContain("company");
  });

  it("accepts the local phone formats the office uses", () => {
    for (const phone of ["0712345678", "+254712345678", "254712345678", "0112345678"]) {
      expect(errorsFor({ primaryPhone: phone })).toEqual([]);
    }
  });
});
