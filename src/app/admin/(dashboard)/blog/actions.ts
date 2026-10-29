"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { createAuditService } from "@/domains/audit/service";
import { assertAdministrator, requireAdminApi } from "@/domains/auth/current";
import {
  archivePost,
  createPost,
  deletePost,
  getAdminPost,
  publishPost,
  unpublishPost,
  updatePost,
} from "@/domains/blog/service";
import { blogPostSchema } from "@/domains/blog/schema";
import { saveBlogCover } from "@/domains/media/service";
import { prisma } from "@/db/client";
import type { ActionState } from "@/lib/action-state";
import { AppError } from "@/lib/errors";
import { currentClientIp } from "@/lib/request";

const audit = createAuditService(prisma);

function inputValues(formData: FormData): Record<string, string> {
  const fields = [
    "title",
    "excerpt",
    "content",
    "category",
    "authorName",
    "coverAlt",
    "seoTitle",
    "seoDescription",
  ];
  return Object.fromEntries(fields.map((field) => [field, String(formData.get(field) ?? "")]));
}

async function writeAudit(
  action: string,
  adminId: string,
  postId: string,
  metadata?: Record<string, string | number | boolean | null>,
) {
  await audit.write({
    action,
    actorUserId: adminId,
    entityType: "blog_post",
    entityId: postId,
    metadata,
    ipAddress: await currentClientIp(),
  });
}

function refreshPublicBlog() {
  updateTag("blog");
  revalidatePath("/insights");
  revalidatePath("/");
}

export async function savePostAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let admin;
  try {
    admin = await requireAdminApi();
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof AppError ? "Your session has expired. Sign in again." : "Unable to save.",
      values: inputValues(formData),
    };
  }

  const id = String(formData.get("id") ?? "").trim();
  const values = inputValues(formData);
  const intent = formData.get("intent") === "publish" ? "publish" : "save";
  const removeCover = formData.get("removeCover") === "on";
  const uploaded = formData.get("cover");

  const parsed = blogPostSchema.safeParse({
    title: values.title,
    excerpt: values.excerpt,
    content: values.content,
    category: values.category,
    authorName: values.authorName,
    coverAlt: values.coverAlt || undefined,
    seoTitle: values.seoTitle || undefined,
    seoDescription: values.seoDescription || undefined,
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields and try again.",
      fields: parsed.error.flatten().fieldErrors,
      values,
    };
  }

  const existing = id ? await getAdminPost(id) : null;
  if (id && !existing) {
    return { status: "error", message: "That article could not be found.", values };
  }

  const hasNewFile = uploaded instanceof File && uploaded.size > 0;
  const coverAlt = parsed.data.coverAlt?.trim() ?? "";
  if ((hasNewFile || (existing?.coverImage && !removeCover)) && coverAlt.length < 4) {
    return {
      status: "error",
      message: "Add a short description of the cover image for accessibility.",
      fields: { coverAlt: ["Describe the cover image in a few words."] },
      values,
    };
  }

  let savedCover: { url: string; alt: string } | null = null;
  if (hasNewFile) {
    try {
      const result = await saveBlogCover(uploaded, coverAlt, admin.id);
      savedCover = { url: result.url, alt: coverAlt };
    } catch (error) {
      return {
        status: "error",
        message: error instanceof AppError ? error.message : "The cover image could not be saved.",
        fields: {
          cover: [
            error instanceof AppError ? error.message : "The cover image could not be saved.",
          ],
        },
        values,
      };
    }
  }

  let postId = id;
  try {
    if (!existing) {
      const created = await createPost(parsed.data, admin.id, savedCover);
      postId = created.id;
      await writeAudit("blog:created", admin.id, created.id, { status: "DRAFT" });
      if (intent === "publish") {
        await publishPost(created.id, admin.id);
        await writeAudit("blog:published", admin.id, created.id);
      }
    } else {
      const coverOptions = {
        ...(savedCover ? { cover: savedCover } : {}),
        ...(removeCover && !savedCover ? { removeCover: true } : {}),
        ...(!savedCover && !removeCover && existing.coverImage && coverAlt
          ? { cover: { url: existing.coverImage, alt: coverAlt } }
          : {}),
      };
      await updatePost(existing.id, parsed.data, admin.id, coverOptions);
      await writeAudit("blog:updated", admin.id, existing.id);
      if (intent === "publish" && existing.status !== "PUBLISHED") {
        await publishPost(existing.id, admin.id);
        await writeAudit("blog:published", admin.id, existing.id);
      }
    }
  } catch {
    return {
      status: "error",
      message: "The article could not be saved. Please try again.",
      values,
    };
  }

  refreshPublicBlog();
  const notice = intent === "publish" ? "published" : "saved";
  redirect(`/admin/blog/${postId}?notice=${notice}`);
}

export async function publishPostAction(formData: FormData): Promise<void> {
  const admin = await requireAdminApi();
  const id = String(formData.get("id") ?? "");
  const post = await getAdminPost(id);
  if (!post) redirect("/admin/blog?notice=missing");
  await publishPost(id, admin.id);
  await writeAudit("blog:published", admin.id, id);
  refreshPublicBlog();
  redirect("/admin/blog?notice=published");
}

export async function unpublishPostAction(formData: FormData): Promise<void> {
  const admin = await requireAdminApi();
  const id = String(formData.get("id") ?? "");
  const post = await getAdminPost(id);
  if (!post) redirect("/admin/blog?notice=missing");
  await unpublishPost(id, admin.id);
  await writeAudit("blog:unpublished", admin.id, id);
  refreshPublicBlog();
  redirect("/admin/blog?notice=unpublished");
}

export async function archivePostAction(formData: FormData): Promise<void> {
  const admin = await requireAdminApi();
  const id = String(formData.get("id") ?? "");
  const post = await getAdminPost(id);
  if (!post) redirect("/admin/blog?notice=missing");
  await archivePost(id, admin.id);
  await writeAudit("blog:archived", admin.id, id);
  refreshPublicBlog();
  redirect("/admin/blog?notice=archived");
}

export async function deletePostAction(formData: FormData): Promise<void> {
  const admin = await requireAdminApi();
  assertAdministrator(admin);
  const id = String(formData.get("id") ?? "");
  const post = await getAdminPost(id);
  if (!post) redirect("/admin/blog?notice=missing");
  await deletePost(id);
  await writeAudit("blog:deleted", admin.id, id, { title: post.title.slice(0, 120) });
  refreshPublicBlog();
  redirect("/admin/blog?notice=deleted");
}
