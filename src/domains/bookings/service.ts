import "server-only";

import type { BookingStatus } from "@/generated/prisma/client";
import { prisma } from "@/db/client";
import { nairobiDateOnly } from "@/lib/dates";

import type { BookingInput } from "./schema";

export const ADMIN_BOOKINGS_PER_PAGE = 15;

export async function createBooking(input: BookingInput) {
  return prisma.booking.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      areaOfInterest: input.areaOfInterest,
      preferredDate: nairobiDateOnly(input.preferredDate),
      preferredTime: input.preferredTime as "MORNING" | "AFTERNOON" | "EVENING",
      message: input.message?.trim() || null,
      privacyAcceptedAt: new Date(),
    },
  });
}

export async function listAdminBookings(options: {
  query?: string;
  status?: BookingStatus | "ALL";
  page?: number;
}) {
  const page = Math.max(1, Math.trunc(options.page ?? 1));
  const where = {
    ...(options.status && options.status !== "ALL" ? { status: options.status } : {}),
    ...(options.query
      ? {
          OR: [
            { name: { contains: options.query } },
            { email: { contains: options.query } },
            { phone: { contains: options.query } },
            { areaOfInterest: { contains: options.query } },
          ],
        }
      : {}),
  };
  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: [{ preferredDate: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * ADMIN_BOOKINGS_PER_PAGE,
      take: ADMIN_BOOKINGS_PER_PAGE,
    }),
    prisma.booking.count({ where }),
  ]);
  return { bookings, total, page, pages: Math.max(1, Math.ceil(total / ADMIN_BOOKINGS_PER_PAGE)) };
}

export async function getAdminBooking(id: string) {
  return prisma.booking.findUnique({ where: { id } });
}

export async function updateBooking(
  id: string,
  data: { status?: BookingStatus; adminNotes?: string | null },
) {
  return prisma.booking.update({ where: { id }, data });
}

export async function countBookings(status?: BookingStatus) {
  return prisma.booking.count({ where: status ? { status } : undefined });
}

export async function upcomingBookings(limit = 5) {
  return prisma.booking.findMany({
    where: { status: { in: ["NEW", "CONTACTED", "CONFIRMED"] } },
    orderBy: [{ preferredDate: "asc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      name: true,
      areaOfInterest: true,
      preferredDate: true,
      preferredTime: true,
      status: true,
    },
  });
}
