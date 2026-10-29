import "server-only";

import { z } from "zod";
import { cacheLife, cacheTag } from "next/cache";

import { prisma } from "@/db/client";

import { PRODUCT_ICON_KEYS } from "@/config/site";

export type PublicProductCard = {
  id: string;
  slug: string;
  name: string;
  eyebrow: string;
  tagline: string;
  summary: string;
  iconKey: string;
  featured: boolean;
  displayOrder: number;
};

export type PublicProduct = PublicProductCard & {
  overview: string;
  whoFor: string;
  howItWorks: string;
  benefits: string;
  notes: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
};

const cardSelect = {
  id: true,
  slug: true,
  name: true,
  eyebrow: true,
  tagline: true,
  summary: true,
  iconKey: true,
  featured: true,
  displayOrder: true,
} as const;

export async function getPublicProducts(): Promise<PublicProductCard[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");

  return prisma.product.findMany({
    where: { published: true },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    select: cardSelect,
  });
}

export async function getPublicProduct(slug: string): Promise<PublicProduct | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");

  return prisma.product.findFirst({
    where: { slug, published: true },
    select: {
      ...cardSelect,
      overview: true,
      whoFor: true,
      howItWorks: true,
      benefits: true,
      notes: true,
      seoTitle: true,
      seoDescription: true,
    },
  });
}

export const productSchema = z.object({
  name: z.string().trim().min(3, "Add a product name.").max(100),
  slug: z
    .string()
    .trim()
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only.")
    .optional()
    .or(z.literal("")),
  eyebrow: z.string().trim().min(2, "Add a short eyebrow.").max(60),
  tagline: z.string().trim().min(5, "Add a tagline.").max(140),
  summary: z.string().trim().min(20, "Add a summary.").max(500),
  overview: z.string().trim().min(40, "Add the overview copy.").max(3000),
  whoFor: z.string().trim().min(20, "Describe who this is for.").max(1200),
  howItWorks: z.string().trim().min(20, "Describe how it works.").max(3000),
  benefits: z.string().trim().min(10, "List at least one benefit.").max(2000),
  notes: z.string().trim().max(2000).optional(),
  iconKey: z.enum(PRODUCT_ICON_KEYS),
  featured: z.coerce.boolean().default(false),
  published: z.coerce.boolean().default(true),
  displayOrder: z.coerce.number().int().min(0).max(999).default(0),
  seoTitle: z.string().trim().max(70).optional(),
  seoDescription: z.string().trim().max(160).optional(),
});

export type ProductInput = z.infer<typeof productSchema>;

export function generateProductSlug(name: string): string {
  return (
    name
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "solution"
  );
}

async function uniqueSlug(base: string, ignoreId?: string): Promise<string> {
  let candidate = base;
  let suffix = 2;
  // Slugs are a public URL contract. Never silently reuse one.
  while (
    await prisma.product.findFirst({
      where: { slug: candidate, ...(ignoreId ? { id: { not: ignoreId } } : {}) },
      select: { id: true },
    })
  ) {
    candidate = `${base.slice(0, 72)}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

function splitLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function listAdminProducts() {
  return prisma.product.findMany({ orderBy: [{ displayOrder: "asc" }, { name: "asc" }] });
}

export async function getAdminProduct(id: string) {
  return prisma.product.findUnique({ where: { id } });
}

export async function createProduct(input: ProductInput) {
  const base = input.slug?.trim() || generateProductSlug(input.name);
  const slug = await uniqueSlug(base);
  return prisma.product.create({
    data: {
      slug,
      name: input.name,
      eyebrow: input.eyebrow,
      tagline: input.tagline,
      summary: input.summary,
      overview: input.overview,
      whoFor: input.whoFor,
      howItWorks: input.howItWorks,
      benefits: input.benefits,
      notes: input.notes || null,
      iconKey: input.iconKey,
      featured: input.featured,
      published: input.published,
      displayOrder: input.displayOrder,
      seoTitle: input.seoTitle || null,
      seoDescription: input.seoDescription || null,
    },
  });
}

export async function updateProduct(id: string, input: ProductInput) {
  return prisma.product.update({
    where: { id },
    data: {
      name: input.name,
      eyebrow: input.eyebrow,
      tagline: input.tagline,
      summary: input.summary,
      overview: input.overview,
      whoFor: input.whoFor,
      howItWorks: input.howItWorks,
      benefits: input.benefits,
      notes: input.notes || null,
      iconKey: input.iconKey,
      featured: input.featured,
      published: input.published,
      displayOrder: input.displayOrder,
      seoTitle: input.seoTitle || null,
      seoDescription: input.seoDescription || null,
    },
  });
}

export async function setProductPublished(id: string, published: boolean) {
  return prisma.product.update({ where: { id }, data: { published } });
}

export function productLines(value: string): string[] {
  return splitLines(value);
}

export function productDetailLines(product: PublicProduct) {
  return {
    benefits: splitLines(product.benefits),
    steps: splitLines(product.howItWorks),
  };
}
