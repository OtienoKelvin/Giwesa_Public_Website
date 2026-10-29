import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { prisma } from "@/db/client";
import type { BlogCategory, BlogStatus } from "@/generated/prisma/client";
import { readingTimeMinutes } from "@/lib/markdown";
import { slugify } from "@/lib/slug";

import type { BlogPostInput } from "./schema";

export const PUBLIC_POSTS_PER_PAGE = 9;
export const ADMIN_POSTS_PER_PAGE = 12;

const listSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  category: true,
  coverImage: true,
  coverAlt: true,
  authorName: true,
  publishedAt: true,
} as const;

export type PublicPostCard = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: BlogCategory;
  coverImage: string | null;
  coverAlt: string | null;
  authorName: string;
  publishedAt: Date | null;
};

export type PublicPost = PublicPostCard & {
  content: string;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: Date;
};

const publicWhere = { status: "PUBLISHED" as const, publishedAt: { not: null } };

export async function getPublishedPosts(options: {
  category?: BlogCategory;
  page?: number;
  perPage?: number;
}): Promise<{ posts: PublicPostCard[]; total: number; page: number; pages: number }> {
  "use cache";
  cacheLife("hours");
  cacheTag("blog");

  const page = Math.max(1, Math.trunc(options.page ?? 1));
  const perPage = Math.min(24, Math.max(1, Math.trunc(options.perPage ?? PUBLIC_POSTS_PER_PAGE)));
  const where = { ...publicWhere, ...(options.category ? { category: options.category } : {}) };

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      select: listSelect,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.blogPost.count({ where }),
  ]);

  return { posts, total, page, pages: Math.max(1, Math.ceil(total / perPage)) };
}

export async function getLatestPosts(limit = 3): Promise<PublicPostCard[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("blog");

  return prisma.blogPost.findMany({
    where: publicWhere,
    select: listSelect,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: Math.min(6, Math.max(1, limit)),
  });
}

export async function getPublishedPost(slug: string): Promise<PublicPost | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("blog");

  return prisma.blogPost.findFirst({
    where: { ...publicWhere, slug },
    select: {
      ...listSelect,
      content: true,
      seoTitle: true,
      seoDescription: true,
      updatedAt: true,
    },
  });
}

export async function getPublishedSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("blog");

  const posts = await prisma.blogPost.findMany({
    where: publicWhere,
    select: { slug: true },
    orderBy: { publishedAt: "desc" },
  });
  return posts.map((post) => post.slug);
}

export async function getRelatedPosts(
  slug: string,
  category: BlogCategory,
  limit = 3,
): Promise<PublicPostCard[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("blog");

  return prisma.blogPost.findMany({
    where: { ...publicWhere, slug: { not: slug }, category },
    select: listSelect,
    orderBy: [{ publishedAt: "desc" }],
    take: Math.min(3, Math.max(1, limit)),
  });
}

export function postReadingTime(content: string): number {
  return readingTimeMinutes(content);
}

async function uniquePostSlug(title: string, ignoreId?: string): Promise<string> {
  const base = slugify(title);
  let candidate = base;
  let suffix = 2;
  while (
    await prisma.blogPost.findFirst({
      where: { slug: candidate, ...(ignoreId ? { id: { not: ignoreId } } : {}) },
      select: { id: true },
    })
  ) {
    candidate = `${base.slice(0, 82)}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

export async function listAdminPosts(options: {
  query?: string;
  status?: BlogStatus | "ALL";
  page?: number;
}): Promise<{
  posts: Array<
    Omit<PublicPostCard, "publishedAt"> & {
      status: BlogStatus;
      updatedAt: Date;
      publishedAt: Date | null;
    }
  >;
  total: number;
  page: number;
  pages: number;
}> {
  const page = Math.max(1, Math.trunc(options.page ?? 1));
  const where = {
    ...(options.status && options.status !== "ALL" ? { status: options.status } : {}),
    ...(options.query
      ? {
          OR: [
            { title: { contains: options.query } },
            { excerpt: { contains: options.query } },
            { authorName: { contains: options.query } },
          ],
        }
      : {}),
  };

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        category: true,
        coverImage: true,
        coverAlt: true,
        authorName: true,
        publishedAt: true,
        status: true,
        updatedAt: true,
      },
      orderBy: [{ updatedAt: "desc" }],
      skip: (page - 1) * ADMIN_POSTS_PER_PAGE,
      take: ADMIN_POSTS_PER_PAGE,
    }),
    prisma.blogPost.count({ where }),
  ]);

  return { posts, total, page, pages: Math.max(1, Math.ceil(total / ADMIN_POSTS_PER_PAGE)) };
}

export async function getAdminPost(id: string) {
  return prisma.blogPost.findUnique({ where: { id } });
}

export async function createPost(
  input: BlogPostInput,
  adminId: string,
  cover?: { url: string; alt: string } | null,
) {
  const slug = await uniquePostSlug(input.title);
  return prisma.blogPost.create({
    data: {
      slug,
      title: input.title,
      excerpt: input.excerpt,
      content: input.content,
      category: input.category as BlogCategory,
      authorName: input.authorName,
      coverImage: cover?.url ?? null,
      coverAlt: cover?.alt ?? null,
      seoTitle: input.seoTitle || null,
      seoDescription: input.seoDescription || null,
      status: "DRAFT",
      createdById: adminId,
      updatedById: adminId,
    },
  });
}

export async function updatePost(
  id: string,
  input: BlogPostInput,
  adminId: string,
  coverOptions: { cover?: { url: string; alt: string } | null; removeCover?: boolean } = {},
) {
  const coverData = coverOptions.removeCover
    ? { coverImage: null, coverAlt: null }
    : coverOptions.cover
      ? { coverImage: coverOptions.cover.url, coverAlt: coverOptions.cover.alt }
      : {};

  return prisma.blogPost.update({
    where: { id },
    data: {
      title: input.title,
      excerpt: input.excerpt,
      content: input.content,
      category: input.category as BlogCategory,
      authorName: input.authorName,
      ...coverData,
      seoTitle: input.seoTitle || null,
      seoDescription: input.seoDescription || null,
      updatedById: adminId,
    },
  });
}

export async function publishPost(id: string, adminId: string) {
  const post = await prisma.blogPost.findUnique({ where: { id }, select: { publishedAt: true } });
  return prisma.blogPost.update({
    where: { id },
    data: {
      status: "PUBLISHED",
      publishedAt: post?.publishedAt ?? new Date(),
      updatedById: adminId,
    },
  });
}

export async function unpublishPost(id: string, adminId: string) {
  return prisma.blogPost.update({
    where: { id },
    data: { status: "DRAFT", updatedById: adminId },
  });
}

export async function archivePost(id: string, adminId: string) {
  return prisma.blogPost.update({
    where: { id },
    data: { status: "ARCHIVED", updatedById: adminId },
  });
}

export async function deletePost(id: string) {
  return prisma.blogPost.delete({ where: { id } });
}

export async function getBlogCounts() {
  const [published, drafts] = await Promise.all([
    prisma.blogPost.count({ where: { status: "PUBLISHED" } }),
    prisma.blogPost.count({ where: { status: "DRAFT" } }),
  ]);
  return { published, drafts };
}
