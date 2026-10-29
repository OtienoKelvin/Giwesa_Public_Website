import Link from "next/link";
import { Filter, Plus, Search, X } from "lucide-react";

import { requireAdminPage } from "@/domains/auth/current";
import { listAdminPosts } from "@/domains/blog/service";
import { BLOG_CATEGORY_LABELS } from "@/config/site";
import { formatDateTime, formatShortDate } from "@/lib/dates";
import {
  AdminEmptyState,
  AdminNotice,
  AdminPageHeader,
  AdminPagination,
  StatusBadge,
} from "@/components/admin/admin-ui";
import { publishPostAction, unpublishPostAction } from "./actions";

const notices: Record<string, string> = {
  published: "Article published. The public insights pages have been refreshed.",
  unpublished: "Article moved back to draft. It is no longer publicly visible.",
  archived: "Article archived. It is no longer publicly visible.",
  unseen: "The article could not be found.",
  missing: "The article could not be found.",
  deleted: "Article permanently deleted.",
};

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string; notice?: string }>;
}) {
  await requireAdminPage();
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const status =
    params.status === "DRAFT" || params.status === "PUBLISHED" || params.status === "ARCHIVED"
      ? params.status
      : "ALL";
  const page = Math.max(1, Math.trunc(Number(params.page ?? 1)) || 1);
  const notice = typeof params.notice === "string" ? notices[params.notice] : undefined;
  const {
    posts,
    pages,
    page: currentPage,
  } = await listAdminPosts({
    query: query || undefined,
    status,
    page,
  });

  return (
    <>
      <AdminPageHeader
        title="Insights"
        description="Create and manage the articles published on the GIWESA public website."
        action={
          <Link
            href="/admin/blog/new"
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-brand px-4 text-xs font-bold text-white hover:bg-brand-dark"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            New article
          </Link>
        }
      />

      {notice ? <AdminNotice>{notice}</AdminNotice> : null}

      <div className="admin-card mb-5 p-4">
        <form
          method="get"
          action="/admin/blog"
          className="flex flex-col gap-3 lg:flex-row lg:items-end"
        >
          <div className="flex-1">
            <label htmlFor="post-search" className="field-label">
              Search articles
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
                aria-hidden="true"
              />
              <input
                id="post-search"
                name="q"
                type="search"
                defaultValue={query}
                placeholder="Title, excerpt or author"
                className="field min-h-10 pl-9"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <label htmlFor="post-status" className="field-label">
              Status
            </label>
            <select id="post-status" name="status" defaultValue={status} className="field min-h-10">
              <option value="ALL">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-brand px-4 text-xs font-bold text-white hover:bg-brand-dark"
            >
              <Filter className="size-3.5" aria-hidden="true" />
              Apply filters
            </button>
            {query || status !== "ALL" ? (
              <Link
                href="/admin/blog"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-admin-line px-3 text-xs font-bold text-ink-muted hover:border-brand hover:text-brand"
              >
                <X className="size-3.5" aria-hidden="true" />
                Clear
              </Link>
            ) : null}
          </div>
        </form>
      </div>

      <div className="admin-card overflow-hidden">
        {posts.length === 0 ? (
          <AdminEmptyState
            title={query || status !== "ALL" ? "No matching articles." : "No articles yet."}
            description={
              query || status !== "ALL"
                ? "Try a different search term or status."
                : "Create the first article for the GIWESA insights section."
            }
            action={
              !query && status === "ALL" ? (
                <Link
                  href="/admin/blog/new"
                  className="inline-flex min-h-10 items-center gap-2 rounded-full bg-brand px-4 text-xs font-bold text-white hover:bg-brand-dark"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  Create an article
                </Link>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="admin-table w-full min-w-[880px] border-collapse">
                <caption className="sr-only">Blog articles</caption>
                <thead>
                  <tr>
                    <th scope="col">Article</th>
                    <th scope="col">Status</th>
                    <th scope="col">Author</th>
                    <th scope="col">Updated</th>
                    <th scope="col">Published</th>
                    <th scope="col" className="text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr key={post.id}>
                      <td className="max-w-[24rem]">
                        <Link
                          href={`/admin/blog/${post.id}`}
                          className="text-xs font-bold text-brand-dark hover:text-brand"
                        >
                          {post.title}
                        </Link>
                        <p className="mt-1 text-[0.625rem] text-ink-muted">
                          {BLOG_CATEGORY_LABELS[post.category] ?? post.category}
                        </p>
                      </td>
                      <td>
                        <StatusBadge status={post.status} />
                      </td>
                      <td className="text-[0.6875rem] text-ink-muted">{post.authorName}</td>
                      <td className="numeric whitespace-nowrap text-[0.6875rem] text-ink-muted">
                        {formatDateTime(post.updatedAt)}
                      </td>
                      <td className="numeric whitespace-nowrap text-[0.6875rem] text-ink-muted">
                        {post.publishedAt ? formatShortDate(post.publishedAt) : "—"}
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/blog/${post.id}`}
                            className="inline-flex min-h-8 items-center rounded-full border border-admin-line px-3 text-[0.625rem] font-bold text-brand hover:border-brand"
                          >
                            Edit
                          </Link>
                          <Link
                            href={`/admin/blog/${post.id}/preview`}
                            className="inline-flex min-h-8 items-center rounded-full border border-admin-line px-3 text-[0.625rem] font-bold text-ink-muted hover:border-brand hover:text-brand"
                          >
                            Preview
                          </Link>
                          {post.status === "PUBLISHED" ? (
                            <form action={unpublishPostAction}>
                              <input type="hidden" name="id" value={post.id} />
                              <button
                                type="submit"
                                className="inline-flex min-h-8 items-center rounded-full border border-admin-line px-3 text-[0.625rem] font-bold text-ink-muted hover:border-warning hover:text-warning"
                              >
                                Unpublish
                              </button>
                            </form>
                          ) : (
                            <form action={publishPostAction}>
                              <input type="hidden" name="id" value={post.id} />
                              <button
                                type="submit"
                                className="inline-flex min-h-8 items-center rounded-full border border-brand bg-brand px-3 text-[0.625rem] font-bold text-white hover:bg-brand-dark"
                              >
                                Publish
                              </button>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-admin-line md:hidden">
              {posts.map((post) => (
                <div key={post.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/admin/blog/${post.id}`}
                      className="text-sm font-bold text-brand-dark"
                    >
                      {post.title}
                    </Link>
                    <StatusBadge status={post.status} />
                  </div>
                  <p className="mt-1 text-[0.625rem] text-ink-muted">
                    {BLOG_CATEGORY_LABELS[post.category] ?? post.category} · {post.authorName}
                  </p>
                  <p className="numeric mt-1 text-[0.625rem] text-ink-muted">
                    Updated {formatDateTime(post.updatedAt)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`/admin/blog/${post.id}`}
                      className="inline-flex min-h-8 items-center rounded-full border border-admin-line px-3 text-[0.625rem] font-bold text-brand"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/admin/blog/${post.id}/preview`}
                      className="inline-flex min-h-8 items-center rounded-full border border-admin-line px-3 text-[0.625rem] font-bold text-ink-muted"
                    >
                      Preview
                    </Link>
                    {post.status === "PUBLISHED" ? (
                      <form action={unpublishPostAction}>
                        <input type="hidden" name="id" value={post.id} />
                        <button className="inline-flex min-h-8 items-center rounded-full border border-admin-line px-3 text-[0.625rem] font-bold text-ink-muted">
                          Unpublish
                        </button>
                      </form>
                    ) : (
                      <form action={publishPostAction}>
                        <input type="hidden" name="id" value={post.id} />
                        <button className="inline-flex min-h-8 items-center rounded-full bg-brand px-3 text-[0.625rem] font-bold text-white">
                          Publish
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        <AdminPagination
          page={currentPage}
          pages={pages}
          basePath="/admin/blog"
          query={{ q: query || undefined, status: status === "ALL" ? undefined : status }}
        />
      </div>
    </>
  );
}
