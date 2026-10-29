import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye, Pencil, Send } from "lucide-react";

import { requireAdminPage } from "@/domains/auth/current";
import { BLOG_CATEGORY_LABELS, BLOG_FALLBACK_COVER } from "@/config/site";
import { getAdminPost, postReadingTime } from "@/domains/blog/service";
import { formatLongDate } from "@/lib/dates";
import { initials } from "@/lib/utils";
import { ArticleBody } from "@/components/public/article-body";
import { StatusBadge } from "@/components/admin/admin-ui";
import { publishPostAction } from "../../actions";

export const metadata: Metadata = { title: "Preview article" };

export default async function PreviewBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const post = await getAdminPost(id);
  if (!post) notFound();

  const category = BLOG_CATEGORY_LABELS[post.category] ?? "Insights";
  const cover = post.coverImage || BLOG_FALLBACK_COVER;
  const published = post.publishedAt ?? post.updatedAt;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-5 flex flex-col justify-between gap-3 rounded-xl border border-[#ead2a3] bg-[#fcf3e0] p-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2.5">
          <Eye className="size-4 text-[#7a5300]" aria-hidden="true" />
          <p className="text-xs font-semibold leading-5 text-[#6f4b00]">
            Staff preview — this article is not being shown as a public page unless it is published.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={post.status} />
          <Link
            href={`/admin/blog/${post.id}`}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-[#d9bf87] px-3 text-[0.625rem] font-bold text-[#6f4b00]"
          >
            <Pencil className="size-3" aria-hidden="true" />
            Edit
          </Link>
          {post.status !== "PUBLISHED" ? (
            <form action={publishPostAction}>
              <input type="hidden" name="id" value={post.id} />
              <button className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-brand px-3 text-[0.625rem] font-bold text-white">
                <Send className="size-3" aria-hidden="true" />
                Publish
              </button>
            </form>
          ) : (
            <Link
              href={`/insights/${post.slug}`}
              target="_blank"
              className="text-[0.625rem] font-bold text-brand underline underline-offset-2"
            >
              View live
            </Link>
          )}
        </div>
      </div>

      <Link
        href="/admin/blog"
        className="mb-5 inline-flex items-center gap-1.5 text-[0.6875rem] font-bold text-ink-muted hover:text-brand"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Back to insights
      </Link>

      <article className="overflow-hidden rounded-2xl border border-admin-line bg-white">
        <header className="px-5 py-8 text-center sm:px-10 sm:py-10">
          <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-leaf-dark">
            {category} · {formatLongDate(published)}
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl font-display text-[2.5rem] leading-[1.05] text-brand-dark sm:text-5xl">
            {post.title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-ink-muted">{post.excerpt}</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-[0.6875rem] text-ink-muted">
            <span className="inline-flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-brand-light text-[0.5rem] font-bold text-brand">
                {initials(post.authorName)}
              </span>
              {post.authorName}
            </span>
            <span className="size-0.5 rounded-full bg-line-strong" aria-hidden="true" />
            <span>{postReadingTime(post.content)} min read</span>
          </div>
        </header>

        <div className="relative mx-auto aspect-[16/9] w-full max-w-4xl overflow-hidden border-y border-admin-line bg-muted">
          <Image
            src={cover}
            alt={post.coverAlt || ""}
            fill
            priority
            sizes="(min-width: 1024px) 900px, 100vw"
            className="object-cover"
          />
        </div>

        <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
          <ArticleBody content={post.content} />
        </div>
      </article>
    </div>
  );
}
