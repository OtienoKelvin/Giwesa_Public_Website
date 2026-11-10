import Link from "next/link";
import { ArrowRight, ArrowUpRight, CalendarCheck, FileText, Inbox, Plus } from "lucide-react";

import { requireAdminPage } from "@/domains/auth/current";
import { isAdministrator } from "@/domains/auth/types";
import { getBlogCounts, listAdminPosts } from "@/domains/blog/service";
import { countInquiries, recentInquiries } from "@/domains/inquiries/service";
import { countBookings, upcomingBookings } from "@/domains/bookings/service";
import { formatDateTime, formatShortDate } from "@/lib/dates";
import { AdminEmptyState, AdminPageHeader, StatusBadge } from "@/components/admin/admin-ui";

export default async function AdminOverviewPage() {
  const admin = await requireAdminPage();
  const leadManager = isAdministrator(admin);

  const [counts, recentPosts] = await Promise.all([
    getBlogCounts(),
    listAdminPosts({ page: 1, status: "ALL" }),
  ]);

  if (!leadManager) {
    return (
      <>
        <AdminPageHeader
          title="Content overview"
          description={`Your content workspace for the public GIWESA website. Signed in as ${admin.name}.`}
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

        <div className="admin-card">
          <div className="grid divide-y divide-admin-line sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <Link href="/admin/blog?status=PUBLISHED" className="group p-5 hover:bg-[#fbfcf9]">
              <p className="text-[0.625rem] font-bold uppercase tracking-[0.12em] text-ink-muted">
                Published posts
              </p>
              <p className="numeric mt-2 font-display text-4xl text-brand-dark">
                {counts.published}
              </p>
              <p className="mt-1 text-xs text-ink-muted">Live on the public site</p>
            </Link>
            <Link href="/admin/blog?status=DRAFT" className="group p-5 hover:bg-[#fbfcf9]">
              <p className="text-[0.625rem] font-bold uppercase tracking-[0.12em] text-ink-muted">
                Draft posts
              </p>
              <p className="numeric mt-2 font-display text-4xl text-brand-dark">{counts.drafts}</p>
              <p className="mt-1 text-xs text-ink-muted">Waiting for review or publication</p>
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <section className="admin-card">
            <div className="flex items-center justify-between border-b border-admin-line px-5 py-4">
              <h2 className="text-sm font-bold text-brand-dark">Needs attention</h2>
            </div>
            <div className="p-5">
              {counts.drafts > 0 ? (
                <Link
                  href="/admin/blog?status=DRAFT"
                  className="flex items-center justify-between gap-4 rounded-lg bg-warning-soft p-3.5 transition-colors hover:bg-[#f9ecd1]"
                >
                  <span className="flex items-center gap-2.5 text-xs font-semibold text-[#6f4b00]">
                    <FileText className="size-4" aria-hidden="true" />
                    {counts.drafts} {counts.drafts === 1 ? "draft is" : "drafts are"} awaiting
                    publication
                  </span>
                  <ArrowRight className="size-3.5 text-[#6f4b00]" aria-hidden="true" />
                </Link>
              ) : (
                <p className="text-xs leading-5 text-ink-muted">
                  No drafts are waiting. You are up to date.
                </p>
              )}
            </div>
          </section>

          <section className="admin-card">
            <div className="flex items-center justify-between border-b border-admin-line px-5 py-4">
              <h2 className="text-sm font-bold text-brand-dark">Recent insights</h2>
              <Link
                href="/admin/blog"
                className="text-[0.6875rem] font-bold text-brand hover:text-brand-dark"
              >
                View all
              </Link>
            </div>
            <div className="divide-y divide-admin-line">
              {recentPosts.posts.slice(0, 4).map((post) => (
                <Link
                  key={post.id}
                  href={`/admin/blog/${post.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-[#fbfcf9]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-brand-dark">{post.title}</p>
                    <p className="mt-1 text-[0.625rem] text-ink-muted">
                      Updated {formatDateTime(post.updatedAt)}
                    </p>
                  </div>
                  <StatusBadge status={post.status} />
                </Link>
              ))}
              {recentPosts.posts.length === 0 ? (
                <AdminEmptyState
                  title="No articles yet."
                  description="Create the first article for the GIWESA insights section."
                  action={
                    <Link href="/admin/blog/new" className="text-xs font-bold text-brand">
                      Create an article
                    </Link>
                  }
                />
              ) : null}
            </div>
          </section>
        </div>
      </>
    );
  }

  const [newInquiries, newBookings, inquiries, bookings] = await Promise.all([
    countInquiries("NEW"),
    countBookings("NEW"),
    recentInquiries(5),
    upcomingBookings(5),
  ]);

  const metrics = [
    {
      label: "New inquiries",
      value: newInquiries,
      href: "/admin/inquiries?status=NEW",
      note: "Awaiting first response",
    },
    {
      label: "New booking requests",
      value: newBookings,
      href: "/admin/bookings?status=NEW",
      note: "Awaiting contact",
    },
    {
      label: "Draft posts",
      value: counts.drafts,
      href: "/admin/blog?status=DRAFT",
      note: "Not yet public",
    },
    {
      label: "Published posts",
      value: counts.published,
      href: "/admin/blog?status=PUBLISHED",
      note: "Live on the site",
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Website overview"
        description={`The operational view of the GIWESA public website. Signed in as ${admin.name}.`}
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

      <section className="admin-card" aria-label="Website overview metrics">
        <div className="grid divide-y divide-admin-line sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          {metrics.map((metric) => (
            <Link key={metric.label} href={metric.href} className="group p-5 hover:bg-[#fbfcf9]">
              <p className="text-[0.625rem] font-bold uppercase tracking-[0.12em] text-ink-muted">
                {metric.label}
              </p>
              <p className="numeric mt-2 font-display text-4xl text-brand-dark">{metric.value}</p>
              <p className="mt-1 flex items-center gap-1 text-[0.6875rem] text-ink-muted">
                {metric.note}
                <ArrowUpRight
                  className="size-3 opacity-0 transition-opacity group-hover:opacity-100"
                  aria-hidden="true"
                />
              </p>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-2">
        <section className="admin-card">
          <div className="flex items-center justify-between border-b border-admin-line px-5 py-4">
            <h2 className="text-sm font-bold text-brand-dark">Needs attention</h2>
            <span className="rounded-full bg-[#f4f5f2] px-2 py-1 text-[0.5625rem] font-bold uppercase tracking-[0.08em] text-ink-muted">
              Action list
            </span>
          </div>
          <div className="space-y-2 p-4">
            {newInquiries > 0 ? (
              <Link
                href="/admin/inquiries?status=NEW"
                className="flex items-center justify-between gap-4 rounded-lg bg-brand-light p-3.5 transition-colors hover:bg-[#dfeaf5]"
              >
                <span className="flex items-center gap-2.5 text-xs font-semibold text-brand-dark">
                  <Inbox className="size-4 text-brand" aria-hidden="true" />
                  {newInquiries} {newInquiries === 1 ? "inquiry needs" : "inquiries need"} a
                  response
                </span>
                <ArrowRight className="size-3.5 text-brand" aria-hidden="true" />
              </Link>
            ) : null}
            {newBookings > 0 ? (
              <Link
                href="/admin/bookings?status=NEW"
                className="flex items-center justify-between gap-4 rounded-lg bg-leaf-light p-3.5 transition-colors hover:bg-[#e3efd8]"
              >
                <span className="flex items-center gap-2.5 text-xs font-semibold text-[#315c20]">
                  <CalendarCheck className="size-4 text-leaf-dark" aria-hidden="true" />
                  {newBookings} {newBookings === 1 ? "booking request is" : "booking requests are"}{" "}
                  waiting for contact
                </span>
                <ArrowRight className="size-3.5 text-leaf-dark" aria-hidden="true" />
              </Link>
            ) : null}
            {counts.drafts > 0 ? (
              <Link
                href="/admin/blog?status=DRAFT"
                className="flex items-center justify-between gap-4 rounded-lg bg-warning-soft p-3.5 transition-colors hover:bg-[#f9ecd1]"
              >
                <span className="flex items-center gap-2.5 text-xs font-semibold text-[#6f4b00]">
                  <FileText className="size-4" aria-hidden="true" />
                  {counts.drafts} {counts.drafts === 1 ? "draft is" : "drafts are"} awaiting
                  publication
                </span>
                <ArrowRight className="size-3.5 text-[#6f4b00]" aria-hidden="true" />
              </Link>
            ) : null}
            {newInquiries === 0 && newBookings === 0 && counts.drafts === 0 ? (
              <p className="px-1 py-4 text-xs leading-5 text-ink-muted">
                You are up to date. New inquiries, booking requests and drafts will appear here.
              </p>
            ) : null}

            <div className="mt-4 border-t border-admin-line pt-4">
              <p className="text-[0.5625rem] font-bold uppercase tracking-widest text-ink-muted">
                Quick actions
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link
                  href="/admin/blog/new"
                  className="inline-flex min-h-8 items-center rounded-full border border-admin-line px-3 text-[0.625rem] font-bold text-brand hover:border-brand"
                >
                  Write an article
                </Link>
                <Link
                  href="/admin/settings"
                  className="inline-flex min-h-8 items-center rounded-full border border-admin-line px-3 text-[0.625rem] font-bold text-ink-muted hover:border-brand hover:text-brand"
                >
                  Website settings
                </Link>
                <a
                  href="/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-8 items-center rounded-full border border-admin-line px-3 text-[0.625rem] font-bold text-ink-muted hover:border-brand hover:text-brand"
                >
                  View public site
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="admin-card">
          <div className="flex items-center justify-between border-b border-admin-line px-5 py-4">
            <h2 className="text-sm font-bold text-brand-dark">Recent inquiries</h2>
            <Link
              href="/admin/inquiries"
              className="text-[0.6875rem] font-bold text-brand hover:text-brand-dark"
            >
              View all
            </Link>
          </div>
          {inquiries.length === 0 ? (
            <AdminEmptyState
              title="No inquiries yet."
              description="New website inquiries will appear here."
            />
          ) : (
            <div className="divide-y divide-admin-line">
              {inquiries.map((inquiry) => (
                <Link
                  key={inquiry.id}
                  href={`/admin/inquiries/${inquiry.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-[#fbfcf9]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-brand-dark">{inquiry.name}</p>
                    <p className="mt-1 truncate text-[0.625rem] text-ink-muted">
                      {inquiry.subject.replace(/-/g, " ")} · {formatShortDate(inquiry.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={inquiry.status} />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="admin-card mt-5">
        <div className="flex items-center justify-between border-b border-admin-line px-5 py-4">
          <h2 className="text-sm font-bold text-brand-dark">Upcoming consultation requests</h2>
          <Link
            href="/admin/bookings"
            className="text-[0.6875rem] font-bold text-brand hover:text-brand-dark"
          >
            View all
          </Link>
        </div>
        {bookings.length === 0 ? (
          <AdminEmptyState
            title="No booking requests."
            description="Consultation requests from the public site will appear here."
          />
        ) : (
          <div className="divide-y divide-admin-line">
            {bookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/admin/bookings/${booking.id}`}
                className="flex flex-col justify-between gap-2 px-5 py-3.5 hover:bg-[#fbfcf9] sm:flex-row sm:items-center"
              >
                <div>
                  <p className="text-xs font-semibold text-brand-dark">{booking.name}</p>
                  <p className="mt-1 text-[0.625rem] text-ink-muted">
                    {booking.areaOfInterest.replace(/-/g, " ")} ·{" "}
                    {formatShortDate(booking.preferredDate)} · {booking.preferredTime.toLowerCase()}
                  </p>
                </div>
                <StatusBadge status={booking.status} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
