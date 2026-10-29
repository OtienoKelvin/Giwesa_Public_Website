import Link from "next/link";
import { ArrowUpRight, ExternalLink, Plus } from "lucide-react";

import { requireAdminPage } from "@/domains/auth/current";
import { listAdminProducts } from "@/domains/products/service";
import {
  AdminEmptyState,
  AdminNotice,
  AdminPageHeader,
  StatusBadge,
} from "@/components/admin/admin-ui";
import { toggleProductPublishedAction } from "./actions";

const notices: Record<string, string> = {
  saved: "Solution saved.",
  published: "Solution published to the public website.",
  unpublished: "Solution removed from the public website.",
  missing: "The solution could not be found.",
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  await requireAdminPage();
  const params = await searchParams;
  const notice = typeof params.notice === "string" ? notices[params.notice] : undefined;
  const products = await listAdminProducts();

  return (
    <>
      <AdminPageHeader
        title="Solutions"
        description="Manage the public solutions listed on the GIWESA website."
        action={
          <Link
            href="/admin/products/new"
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-brand px-4 text-xs font-bold text-white hover:bg-brand-dark"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            New solution
          </Link>
        }
      />

      {notice ? <AdminNotice>{notice}</AdminNotice> : null}

      <div className="admin-card overflow-hidden">
        {products.length === 0 ? (
          <AdminEmptyState
            title="No solutions yet."
            description="Create the first solution to show it on the public site."
            action={
              <Link
                href="/admin/products/new"
                className="inline-flex min-h-10 items-center gap-2 rounded-full bg-brand px-4 text-xs font-bold text-white"
              >
                <Plus className="size-3.5" aria-hidden="true" />
                Create a solution
              </Link>
            }
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="admin-table w-full min-w-[780px] border-collapse">
                <caption className="sr-only">Public solutions</caption>
                <thead>
                  <tr>
                    <th scope="col">Solution</th>
                    <th scope="col">Status</th>
                    <th scope="col">Order</th>
                    <th scope="col">Featured</th>
                    <th scope="col" className="text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="text-xs font-bold text-brand-dark hover:text-brand"
                        >
                          {product.name}
                        </Link>
                        <p className="mt-1 font-mono text-[0.625rem] text-ink-muted">
                          /solutions/{product.slug}
                        </p>
                      </td>
                      <td>
                        <StatusBadge status={product.published ? "PUBLISHED" : "DRAFT"} />
                      </td>
                      <td className="numeric text-xs text-ink-muted">{product.displayOrder}</td>
                      <td className="text-xs text-ink-muted">{product.featured ? "Yes" : "No"}</td>
                      <td>
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="inline-flex min-h-8 items-center rounded-full border border-admin-line px-3 text-[0.625rem] font-bold text-brand hover:border-brand"
                          >
                            Edit
                          </Link>
                          {product.published ? (
                            <Link
                              href={`/solutions/${product.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex min-h-8 items-center gap-1 rounded-full border border-admin-line px-3 text-[0.625rem] font-bold text-ink-muted hover:border-brand hover:text-brand"
                            >
                              View
                              <ExternalLink className="size-2.5" aria-hidden="true" />
                            </Link>
                          ) : null}
                          <form action={toggleProductPublishedAction}>
                            <input type="hidden" name="id" value={product.id} />
                            <button className="inline-flex min-h-8 items-center rounded-full border border-admin-line px-3 text-[0.625rem] font-bold text-ink-muted hover:border-warning hover:text-warning">
                              {product.published ? "Unpublish" : "Publish"}
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-admin-line md:hidden">
              {products.map((product) => (
                <div key={product.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="text-sm font-bold text-brand-dark"
                    >
                      {product.name}
                    </Link>
                    <StatusBadge status={product.published ? "PUBLISHED" : "DRAFT"} />
                  </div>
                  <p className="mt-1 text-[0.625rem] text-ink-muted">
                    Order {product.displayOrder} · {product.featured ? "Featured" : "Not featured"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="inline-flex min-h-8 items-center rounded-full border border-admin-line px-3 text-[0.625rem] font-bold text-brand"
                    >
                      Edit
                    </Link>
                    <form action={toggleProductPublishedAction}>
                      <input type="hidden" name="id" value={product.id} />
                      <button className="inline-flex min-h-8 items-center rounded-full border border-admin-line px-3 text-[0.625rem] font-bold text-ink-muted">
                        {product.published ? "Unpublish" : "Publish"}
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <p className="mt-4 flex items-center gap-1.5 text-[0.6875rem] text-ink-muted">
        <ArrowUpRight className="size-3" aria-hidden="true" />
        Unpublished solutions remain editable but are hidden from the public site.
      </p>
    </>
  );
}
