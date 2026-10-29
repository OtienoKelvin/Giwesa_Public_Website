import "server-only";

import type { InquiryStatus } from "@/generated/prisma/client";
import { prisma } from "@/db/client";

import type { InquiryInput } from "./schema";

export const ADMIN_INQUIRIES_PER_PAGE = 15;

export async function createInquiry(input: InquiryInput) {
  return prisma.inquiry.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      subject: input.subject,
      message: input.message,
      privacyAcceptedAt: new Date(),
    },
  });
}

export async function listAdminInquiries(options: {
  query?: string;
  status?: InquiryStatus | "ALL";
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
            { subject: { contains: options.query } },
          ],
        }
      : {}),
  };
  const [inquiries, total] = await Promise.all([
    prisma.inquiry.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * ADMIN_INQUIRIES_PER_PAGE,
      take: ADMIN_INQUIRIES_PER_PAGE,
    }),
    prisma.inquiry.count({ where }),
  ]);
  return {
    inquiries,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / ADMIN_INQUIRIES_PER_PAGE)),
  };
}

export async function getAdminInquiry(id: string) {
  return prisma.inquiry.findUnique({ where: { id } });
}

export async function updateInquiry(
  id: string,
  data: { status?: InquiryStatus; adminNotes?: string | null },
) {
  return prisma.inquiry.update({ where: { id }, data });
}

export async function countInquiries(status?: InquiryStatus) {
  return prisma.inquiry.count({ where: status ? { status } : undefined });
}

export async function recentInquiries(limit = 5) {
  return prisma.inquiry.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      subject: true,
      status: true,
      createdAt: true,
    },
  });
}
