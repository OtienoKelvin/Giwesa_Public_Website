import "server-only";

import { z } from "zod";
import { cacheLife, cacheTag } from "next/cache";

import { prisma } from "@/db/client";
import { SITE } from "@/config/site";
import { emailSchema, phoneSchema } from "@/lib/validation";

export type PublicSiteSettings = {
  phone: string;
  email: string;
  address: string;
  officeHours: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  xUrl: string | null;
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
};

const fallbackSettings: PublicSiteSettings = {
  phone: SITE.defaultPhone,
  email: SITE.defaultEmail,
  address: SITE.defaultAddress,
  officeHours: null,
  facebookUrl: null,
  instagramUrl: null,
  linkedinUrl: null,
  xUrl: null,
  heroEyebrow: "Savings · Micro-loans · Welfare",
  heroTitle: "Savings, loans and welfare protection, made for everyday life.",
  heroDescription:
    "GIWESA Solutions is a Kenyan microfinance organisation helping individuals, families and small businesses plan, save, borrow and protect what matters — with practical guidance at every step.",
};

export async function getSiteSettings(): Promise<PublicSiteSettings> {
  "use cache";
  cacheLife("hours");
  cacheTag("site-settings");

  const row = await prisma.siteSetting.findUnique({ where: { id: 1 } });
  if (!row) return fallbackSettings;

  return {
    phone: row.phone,
    email: row.email,
    address: row.address,
    officeHours: row.officeHours,
    facebookUrl: row.facebookUrl,
    instagramUrl: row.instagramUrl,
    linkedinUrl: row.linkedinUrl,
    xUrl: row.xUrl,
    heroEyebrow: row.heroEyebrow,
    heroTitle: row.heroTitle,
    heroDescription: row.heroDescription,
  };
}

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine((value) => value === "" || /^https?:\/\/[^\s]+$/i.test(value), {
    message: "Enter a full http(s) URL or leave this blank.",
  });

export const settingsSchema = z.object({
  phone: phoneSchema,
  email: emailSchema,
  address: z.string().trim().min(10, "Enter the office address.").max(1000),
  officeHours: z.string().trim().max(300).optional(),
  facebookUrl: optionalUrl,
  instagramUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  xUrl: optionalUrl,
  heroEyebrow: z.string().trim().min(2, "Add a short eyebrow.").max(80),
  heroTitle: z.string().trim().min(10, "Add a hero heading.").max(180),
  heroDescription: z.string().trim().min(30, "Add a hero description.").max(500),
});

export type SettingsInput = z.infer<typeof settingsSchema>;

export async function getAdminSettings() {
  return prisma.siteSetting.findUnique({ where: { id: 1 } });
}

export async function updateSiteSettings(input: SettingsInput, adminId: string) {
  const data = {
    phone: input.phone,
    email: input.email,
    address: input.address,
    officeHours: input.officeHours || null,
    facebookUrl: input.facebookUrl || null,
    instagramUrl: input.instagramUrl || null,
    linkedinUrl: input.linkedinUrl || null,
    xUrl: input.xUrl || null,
    heroEyebrow: input.heroEyebrow,
    heroTitle: input.heroTitle,
    heroDescription: input.heroDescription,
    updatedById: adminId,
  };

  return prisma.siteSetting.upsert({
    where: { id: 1 },
    create: { id: 1, ...data },
    update: data,
  });
}
