import Link from "next/link";
import { Filter, Search, X } from "lucide-react";

import { requireLeadManagerPage } from "@/domains/auth/current";
import { listAdminInquiries } from "@/domains/inquiries/service";
import { INQUIRY_SUBJECTS } from "@/config/site";
import { formatDateTime } from "@/lib/dates";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPagination,
  StatusBadge,
} from "@/components/admin/admin-ui";

const statusOptions = [
  { value: "ALL", label: "All statuses" },
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "ARCHIVED", label: "Archived" },
] as const;

const subjectLabels: Record<string, string> = Object.fromEntries(
  INQUIRY_SUBJECTS.map((subject) => [subject.value, subject.label]),
);

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  await requireLeadManagerPage();
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const status =
    typeof params.status === "string" &&
    statusOptions.some((option) => option.value === params.status)
      ? (params.status as (typeof statusOptions)[number]["value"])
      : "ALL";
  const page = Math.max(1, Math.trunc(Number(params.page ?? 1)) || 1);
  const {
    inquiries,
    total,
    pages,
    page: currentPage,
  } = await listAdminInquiries({
    query: query || undefined,
    status,
    page,
  });

  return (
    <>
      <AdminPageHeader
        title="Inquiries"
        description={`${total} ${total === 1 ? "inquiry" : "inquiries"} received through the public website.`}
      />

      <div className="admin-card mb-5 p-4">
        <form
          method="get"
          action="/admin/inquiries"
          className="flex flex-col gap-3 lg:flex-row lg:items-end"
        >
          <div className="flex-1">
            <label htmlFor="inquiry-search" className="field-label">
              Search inquiries
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
                aria-hidden="true"
              />
              <input
                id="inquiry-search"
                name="q"
                type="search"
                defaultValue={query}
                placeholder="Name, email, phone or subject"
                className="field min-h-10 pl-9"
              />
            </div>
          </div>
          <div className="sm:w-52">
            <label htmlFor="inquiry-status" className="field-label">
              Status
            </label>
            <select
              id="inquiry-status"
              name="status"
              defaultValue={status}
              className="field min-h-10"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
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
                href="/admin/inquiries"
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
        {inquiries.length === 0 ? (
          <AdminEmptyState
            title={query || status !== "ALL" ? "No matching inquiries." : "No inquiries yet."}
            description={
              query || status !== "ALL"
                ? "Try a different search term or status."
                : "New website inquiries will appear here."
            }
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="admin-table w-full min-w-[760px] border-collapse">
                <caption className="sr-only">Website inquiries</caption>
                <thead>
                  <tr>
                    <th scope="col">Visitor</th>
                    <th scope="col">Subject</th>
                    <th scope="col">Received</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {inquiries.map((inquiry) => (
                    <tr key={inquiry.id}>
                      <td>
                        <p className="text-xs font-bold text-brand-dark">{inquiry.name}</p>
                        <p className="mt-1 text-[0.6875rem] text-ink-muted">{inquiry.email}</p>
                        <p className="numeric mt-0.5 text-[0.6875rem] text-ink-muted">
                          {inquiry.phone}
                        </p>
                      </td>
                      <td className="max-w-[15rem] text-xs text-ink-muted">
                        {subjectLabels[inquiry.subject] ?? inquiry.subject}
                      </td>
                      <td className="numeric whitespace-nowrap text-[0.6875rem] text-ink-muted">
                        {formatDateTime(inquiry.createdAt)}
                      </td>
                      <td>
                        <StatusBadge status={inquiry.status} />
                      </td>
                      <td className="text-right">
                        <Link
                          href={`/admin/inquiries/${inquiry.id}`}
                          className="inline-flex min-h-8 items-center rounded-full border border-admin-line px-3 text-[0.6875rem] font-bold text-brand hover:border-brand"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-admin-line md:hidden">
              {inquiries.map((inquiry) => (
                <Link
                  key={inquiry.id}
                  href={`/admin/inquiries/${inquiry.id}`}
                  className="block p-4 hover:bg-[#fbfcf9]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-brand-dark">{inquiry.name}</p>
                      <p className="mt-1 text-[0.6875rem] text-ink-muted">
                        {subjectLabels[inquiry.subject] ?? inquiry.subject}
                      </p>
                    </div>
                    <StatusBadge status={inquiry.status} />
                  </div>
                  <p className="mt-2 text-[0.6875rem] text-ink-muted">
                    {inquiry.email} · {inquiry.phone}
                  </p>
                  <p className="numeric mt-1 text-[0.625rem] text-ink-muted">
                    {formatDateTime(inquiry.createdAt)}
                  </p>
                </Link>
              ))}
            </div>
          </>
        )}
        <AdminPagination
          page={currentPage}
          pages={pages}
          basePath="/admin/inquiries"
          query={{ q: query || undefined, status: status === "ALL" ? undefined : status }}
        />
      </div>
    </>
  );
}
