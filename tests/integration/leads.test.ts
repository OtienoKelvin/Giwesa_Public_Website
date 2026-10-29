import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { bookingSchema } from "@/domains/bookings/schema";
import { createBooking, getAdminBooking, updateBooking } from "@/domains/bookings/service";
import { inquirySchema } from "@/domains/inquiries/schema";
import {
  createInquiry,
  getAdminInquiry,
  listAdminInquiries,
  updateInquiry,
} from "@/domains/inquiries/service";
import { getPublicProduct } from "@/domains/products/service";
import { todayInNairobi } from "@/lib/dates";
import { prisma, resetDatabase } from "../helpers/db";

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("inquiry persistence and management", () => {
  it("persists a valid inquiry and updates its status", async () => {
    const input = inquirySchema.parse({
      name: "Akinyi Otieno",
      email: "akinyi@example.com",
      phone: "0712 345 678",
      subject: "savings-and-loans",
      message: "I would like to understand the savings process.",
      privacy: true,
      company: "",
      startedAt: Date.now(),
    });
    const inquiry = await createInquiry(input);
    expect(inquiry.status).toBe("NEW");
    expect(inquiry.phone).toBe("0712345678");

    const listed = await listAdminInquiries({ query: "Akinyi" });
    expect(listed.total).toBe(1);

    await updateInquiry(inquiry.id, { status: "CONTACTED", adminNotes: "Called once." });
    const updated = await getAdminInquiry(inquiry.id);
    expect(updated?.status).toBe("CONTACTED");
    expect(updated?.adminNotes).toBe("Called once.");
  });

  it("rejects invalid input before persistence", async () => {
    const result = inquirySchema.safeParse({
      name: "A",
      email: "wrong",
      phone: "12",
      subject: "unknown",
      message: "short",
      privacy: false,
      company: "bot",
      startedAt: 1,
    });
    expect(result.success).toBe(false);
    expect(await prisma.inquiry.count()).toBe(0);
  });
});

describe("booking request persistence and management", () => {
  it("persists a valid request and updates its status", async () => {
    const input = bookingSchema.parse({
      name: "Brian Ochieng",
      email: "brian@example.com",
      phone: "+254 712 345 678",
      areaOfInterest: "welfare-protection",
      preferredDate: todayInNairobi(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)),
      preferredTime: "AFTERNOON",
      message: "I would like to discuss family cover.",
      privacy: true,
      company: "",
      startedAt: Date.now(),
    });
    const booking = await createBooking(input);
    expect(booking.status).toBe("NEW");
    expect(booking.preferredTime).toBe("AFTERNOON");

    await updateBooking(booking.id, { status: "CONFIRMED", adminNotes: "Confirmed by phone." });
    const updated = await getAdminBooking(booking.id);
    expect(updated?.status).toBe("CONFIRMED");
  });
});

describe("public product visibility", () => {
  it("does not expose an unpublished solution", async () => {
    await prisma.product.create({
      data: {
        slug: "hidden-solution",
        name: "Hidden solution",
        eyebrow: "Not public",
        tagline: "This solution is not published.",
        summary: "A hidden solution used by the integration test.",
        overview: "This record exists only to verify that unpublished solutions are filtered out.",
        whoFor: "Nobody until it is published.",
        howItWorks: "It stays hidden until published.",
        benefits: "It is not visible.",
        published: false,
      },
    });
    expect(await getPublicProduct("hidden-solution")).toBeNull();
  });
});
