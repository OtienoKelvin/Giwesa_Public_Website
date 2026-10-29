import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Eye, Trash2, Undo2 } from "lucide-react";

import { requireAdminPage } from "@/domains/auth/current";
import { isAdministrator } from "@/domains/auth/types";
import { getAdminPost } from "@/domains/blog/service";
import { AdminNotice, AdminPageHeader, StatusBadge } from "@/components/admin/admin-ui";
import { BlogPostForm } from "@/components/admin/blog-form";
import { DestructiveForm } from "@/components/admin/destructive-form";
import {
  archivePostAction,
  deletePostAction,
  publishPostAction,
  unpublishPostAction,
} from "../actions";

export const metadata: Metadata = { title: "Edit article" };

const notices: Record<string, string> = {
  saved: "Draft saved.",
  published: "Article saved and published.",
};

export default async function EditBlogPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const admin = await requireAdminPage();
  const { id } = await params;
  const post = await getAdminPost(id);
  if (!post) notFound();
  const query = await searchParams;
  const notice = query.notice ? notices[query.notice] : undefined;

  return (
    <>
      <AdminPageHeader
        title={post.title}
        description={`${post.status === "PUBLISHED" ? "Published" : post.status.toLowerCase()} article · last updated ${post.updatedAt.toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })}`}
        backHref="/admin/blog"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={post.status} />
            <Link
              href={`/admin/blog/${post.id}/preview`}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-admin-line bg-white px-3 text-[0.6875rem] font-bold text-ink-muted hover:border-brand hover:text-brand"
            >
              <Eye className="size-3.5" aria-hidden="true" />
              Preview
            </Link>
            {post.status === "PUBLISHED" ? (
              <Link
                href={`/insights/${post.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-admin-line bg-white px-3 text-[0.6875rem] font-bold text-ink-muted hover:border-brand hover:text-brand"
              >
                <ExternalLink className="size-3.5" aria-hidden="true" />
                View live
              </Link>
            ) : null}
            {post.status !== "ARCHIVED" ? (
              <form action={archivePostAction}>
                <input type="hidden" name="id" value={post.id} />
                <button className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-admin-line bg-white px-3 text-[0.6875rem] font-bold text-ink-muted hover:border-warning hover:text-warning">
                  <Undo2 className="size-3.5" aria-hidden="true" />
                  Archive
                </button>
              </form>
            ) : null}
            {isAdministrator(admin) ? (
              <DestructiveForm
                action={deletePostAction}
                message={`Permanently delete “${post.title}”? This cannot be undone.`}
              >
                <input type="hidden" name="id" value={post.id} />
                <button className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-admin-line bg-white px-3 text-[0.6875rem] font-bold text-danger hover:border-danger">
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  Delete
                </button>
              </DestructiveForm>
            ) : null}
          </div>
        }
      />

      {notice ? <AdminNotice>{notice}</AdminNotice> : null}

      {post.status === "PUBLISHED" ? (
        <div className="mb-5 flex flex-col justify-between gap-3 rounded-xl border border-[#b9d8c3] bg-[#eef8f1] p-4 sm:flex-row sm:items-center">
          <p className="text-xs font-semibold leading-5 text-[#2e6b45]">
            This article is live on the public website. Saving changes updates the public version.
          </p>
          <form action={unpublishPostAction}>
            <input type="hidden" name="id" value={post.id} />
            <button className="text-[0.6875rem] font-bold text-[#2e6b45] underline underline-offset-2">
              Unpublish instead
            </button>
          </form>
        </div>
      ) : post.status === "ARCHIVED" ? (
        <div className="mb-5 flex flex-col justify-between gap-3 rounded-xl border border-admin-line bg-[#f6f7f5] p-4 sm:flex-row sm:items-center">
          <p className="text-xs font-semibold leading-5 text-ink-muted">
            This article is archived and not publicly visible. Save and publish to make it live
            again.
          </p>
          <form action={publishPostAction}>
            <input type="hidden" name="id" value={post.id} />
            <button className="text-[0.6875rem] font-bold text-brand underline underline-offset-2">
              Publish now
            </button>
          </form>
        </div>
      ) : null}

      <BlogPostForm
        adminName={admin.name}
        initial={{
          id: post.id,
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          category: post.category,
          authorName: post.authorName,
          coverImage: post.coverImage,
          coverAlt: post.coverAlt,
          status: post.status,
          seoTitle: post.seoTitle,
          seoDescription: post.seoDescription,
        }}
      />
    </>
  );
}
