import { describe, expect, it } from "vitest";

import { bookingSchema } from "@/domains/bookings/schema";
import { inquirySchema } from "@/domains/inquiries/schema";
import { daysFromTodayInNairobi, todayInNairobi } from "@/lib/dates";

const baseInquiry = {
  name: "Akinyi Otieno",
  email: "akinyi@example.com",
  phone: "0712 345 678",
  subject: "savings-and-loans",
  message: "I would like to understand the savings process.",
  privacy: true,
  company: "",
  startedAt: Date.now(),
};

const baseBooking = {
  name: "Brian Ochieng",
  email: "brian@example.com",
  phone: "+254 712 345 678",
  areaOfInterest: "welfare-protection",
  preferredDate: todayInNairobi(new Date(Date.now() + 24 * 60 * 60 * 1000)),
  preferredTime: "MORNING",
  message: "",
  privacy: true,
  company: "",
  startedAt: Date.now(),
};

describe("inquiry validation", () => {
  it("accepts a valid inquiry and normalises the phone number", () => {
    const result = inquirySchema.safeParse(baseInquiry);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.phone).toBe("0712345678");
  });

  it("rejects an invalid email, short message and missing consent", () => {
    const result = inquirySchema.safeParse({
      ...baseInquiry,
      email: "not-an-email",
      message: "short",
      privacy: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors;
      expect(fields.email).toBeTruthy();
      expect(fields.message).toBeTruthy();
      expect(fields.privacy).toBeTruthy();
    }
  });

  it("rejects a filled honeypot", () => {
    const result = inquirySchema.safeParse({ ...baseInquiry, company: "spam" });
    expect(result.success).toBe(false);
  });
});

describe("booking validation", () => {
  it("accepts a valid future request", () => {
    expect(bookingSchema.safeParse(baseBooking).success).toBe(true);
  });

  it("rejects a past date", () => {
    const yesterday = todayInNairobi(new Date(Date.now() - 24 * 60 * 60 * 1000));
    const result = bookingSchema.safeParse({ ...baseBooking, preferredDate: yesterday });
    expect(result.success).toBe(false);
    expect(daysFromTodayInNairobi(yesterday)).toBeLessThan(0);
  });

  it("rejects an invalid calendar date", () => {
    const result = bookingSchema.safeParse({
      ...baseBooking,
      preferredDate: "2026-02-31",
    });
    expect(result.success).toBe(false);
  });
});
