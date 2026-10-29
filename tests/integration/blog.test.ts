import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { createAuthService } from "@/domains/auth/service";
import { hashPassword } from "@/domains/auth/password";
import {
  getAdminPost,
  createPost,
  listAdminPosts,
  publishPost,
  unpublishPost,
  updatePost,
  getPublishedPost,
} from "@/domains/blog/service";
import { blogPostSchema } from "@/domains/blog/schema";
import { prisma, resetDatabase } from "../helpers/db";

async function adminId() {
  const admin = await prisma.adminUser.create({
    data: {
      name: "Test Editor",
      email: "editor@test.local",
      passwordHash: await hashPassword("CorrectPassword123!"),
      role: "CONTENT_MANAGER",
    },
  });
  return admin.id;
}

const input = blogPostSchema.parse({
  title: "A useful article about saving",
  excerpt: "This is a sufficiently long excerpt for the article.",
  content:
    "This is a sufficiently long article body that explains a practical idea clearly and calmly for readers of the GIWESA website.",
  category: "FINANCIAL_WELLBEING",
  authorName: "GIWESA Editorial",
});

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("blog lifecycle and public visibility", () => {
  it("creates a draft that is hidden from public queries", async () => {
    const authorId = await adminId();
    const post = await createPost(input, authorId);
    expect(post.status).toBe("DRAFT");
    expect(await getPublishedPost(post.slug)).toBeNull();
    const draft = await getPublishedPost(post.slug);
    expect(draft).toBeNull();
  });

  it("publishes a post, exposes it publicly and hides it again when unpublished", async () => {
    const authorId = await adminId();
    const post = await createPost(input, authorId);
    const published = await publishPost(post.id, authorId);
    expect(published.publishedAt).toBeInstanceOf(Date);

    const visible = await getPublishedPost(post.slug);
    expect(visible?.title).toBe(input.title);

    await unpublishPost(post.id, authorId);
    expect(await getPublishedPost(post.slug)).toBeNull();
  });

  it("preserves uniqueness when two articles have the same title", async () => {
    const authorId = await adminId();
    const first = await createPost(input, authorId);
    const second = await createPost(input, authorId);
    expect(first.slug).not.toBe(second.slug);
    expect(second.slug).toContain(first.slug);
  });

  it("edits a draft and lists it for admins", async () => {
    const authorId = await adminId();
    const post = await createPost(input, authorId);
    await updatePost(post.id, { ...input, title: "A revised article about saving" }, authorId);
    const stored = await getAdminPost(post.id);
    expect(stored?.title).toBe("A revised article about saving");
    const list = await listAdminPosts({ query: "revised" });
    expect(list.total).toBe(1);
  });
});

describe("admin authority boundary", () => {
  it("does not allow a session token to be reused as a password", async () => {
    const authorId = await adminId();
    const auth = createAuthService(prisma);
    const result = await auth.login("editor@test.local", "CorrectPassword123!");
    expect(result.token).toBeTruthy();
    await expect(auth.login("editor@test.local", result.token)).rejects.toThrow();
    expect(authorId).toBeTruthy();
  });
});
