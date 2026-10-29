import Link from "next/link";
import { Filter, Search, X } from "lucide-react";

import { requireLeadManagerPage } from "@/domains/auth/current";
import { listAdminBookings } from "@/domains/bookings/service";
import { INTEREST_OPTIONS, PREFERRED_TIMES } from "@/config/site";
import { formatDateTime, formatShortDate } from "@/lib/dates";
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
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

const areaLabels: Record<string, string> = Object.fromEntries(
  INTEREST_OPTIONS.map((area) => [area.value, area.label]),
);
const timeLabels: Record<string, string> = Object.fromEntries(
  PREFERRED_TIMES.map((time) => [time.value, time.label]),
);

export default async function AdminBookingsPage({
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
    bookings,
    total,
    pages,
    page: currentPage,
  } = await listAdminBookings({
    query: query || undefined,
    status,
    page,
  });

  return (
    <>
      <AdminPageHeader
        title="Booking requests"
        description={`${total} consultation ${total === 1 ? "request" : "requests"}. These are requests, not automatically confirmed appointments.`}
      />

      <div className="admin-card mb-5 p-4">
        <form
          method="get"
          action="/admin/bookings"
          className="flex flex-col gap-3 lg:flex-row lg:items-end"
        >
          <div className="flex-1">
            <label htmlFor="booking-search" className="field-label">
              Search booking requests
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
                aria-hidden="true"
              />
              <input
                id="booking-search"
                name="q"
                type="search"
                defaultValue={query}
                placeholder="Name, email, phone or area"
                className="field min-h-10 pl-9"
              />
            </div>
          </div>
          <div className="sm:w-52">
            <label htmlFor="booking-status" className="field-label">
              Status
            </label>
            <select
              id="booking-status"
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
                href="/admin/bookings"
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
        {bookings.length === 0 ? (
          <AdminEmptyState
            title={query || status !== "ALL" ? "No matching requests." : "No booking requests."}
            description={
              query || status !== "ALL"
                ? "Try a different search term or status."
                : "Consultation requests from the public site will appear here."
            }
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="admin-table w-full min-w-[820px] border-collapse">
                <caption className="sr-only">Consultation requests</caption>
                <thead>
                  <tr>
                    <th scope="col">Visitor</th>
                    <th scope="col">Area</th>
                    <th scope="col">Preferred</th>
                    <th scope="col">Received</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td>
                        <p className="text-xs font-bold text-brand-dark">{booking.name}</p>
                        <p className="mt-1 text-[0.6875rem] text-ink-muted">{booking.email}</p>
                        <p className="numeric mt-0.5 text-[0.6875rem] text-ink-muted">
                          {booking.phone}
                        </p>
                      </td>
                      <td className="text-xs text-ink-muted">
                        {areaLabels[booking.areaOfInterest] ?? booking.areaOfInterest}
                      </td>
                      <td className="whitespace-nowrap text-[0.6875rem] text-ink-muted">
                        {formatShortDate(booking.preferredDate)}
                        <span className="block text-[0.625rem]">
                          {timeLabels[booking.preferredTime] ?? booking.preferredTime}
                        </span>
                      </td>
                      <td className="numeric whitespace-nowrap text-[0.6875rem] text-ink-muted">
                        {formatDateTime(booking.createdAt)}
                      </td>
                      <td>
                        <StatusBadge status={booking.status} />
                      </td>
                      <td className="text-right">
                        <Link
                          href={`/admin/bookings/${booking.id}`}
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
              {bookings.map((booking) => (
                <Link
                  key={booking.id}
                  href={`/admin/bookings/${booking.id}`}
                  className="block p-4 hover:bg-[#fbfcf9]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-brand-dark">{booking.name}</p>
                      <p className="mt-1 text-[0.6875rem] text-ink-muted">
                        {areaLabels[booking.areaOfInterest] ?? booking.areaOfInterest}
                      </p>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>
                  <p className="mt-2 text-[0.6875rem] text-ink-muted">
                    {formatShortDate(booking.preferredDate)} ·{" "}
                    {timeLabels[booking.preferredTime] ?? booking.preferredTime}
                  </p>
                  <p className="mt-1 text-[0.6875rem] text-ink-muted">
                    {booking.email} · {booking.phone}
                  </p>
                </Link>
              ))}
            </div>
          </>
        )}
        <AdminPagination
          page={currentPage}
          pages={pages}
          basePath="/admin/bookings"
          query={{ q: query || undefined, status: status === "ALL" ? undefined : status }}
        />
      </div>
    </>
  );
}
