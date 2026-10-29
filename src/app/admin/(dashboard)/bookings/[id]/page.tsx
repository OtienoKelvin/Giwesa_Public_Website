import { notFound } from "next/navigation";
import { CalendarClock, Mail, Phone } from "lucide-react";

import { requireLeadManagerPage } from "@/domains/auth/current";
import { getAdminBooking } from "@/domains/bookings/service";
import { INTEREST_OPTIONS, PREFERRED_TIMES } from "@/config/site";
import { formatDateTime, formatShortDate } from "@/lib/dates";
import { phoneHref } from "@/lib/utils";
import { AdminPageHeader, StatusBadge } from "@/components/admin/admin-ui";
import { LeadStatusForm } from "@/components/admin/lead-status-form";
import { updateBookingAction } from "../actions";

const areaLabels: Record<string, string> = Object.fromEntries(
  INTEREST_OPTIONS.map((area) => [area.value, area.label]),
);
const timeLabels: Record<string, string> = Object.fromEntries(
  PREFERRED_TIMES.map((time) => [time.value, time.label]),
);

export default async function AdminBookingPage({ params }: { params: Promise<{ id: string }> }) {
  await requireLeadManagerPage();
  const { id } = await params;
  const booking = await getAdminBooking(id);
  if (!booking) notFound();

  return (
    <>
      <AdminPageHeader
        title="Booking request detail"
        description={`Received ${formatDateTime(booking.createdAt)}`}
        backHref="/admin/bookings"
        action={<StatusBadge status={booking.status} />}
      />

      <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-5">
          <section className="admin-card p-5 sm:p-6">
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-ink-muted">
              Visitor
            </p>
            <h2 className="mt-2 font-display text-3xl text-brand-dark">{booking.name}</h2>
            <div className="mt-4 grid gap-3 border-t border-admin-line pt-4 sm:grid-cols-2">
              <a
                href={`mailto:${booking.email}`}
                className="flex items-center gap-2 break-all text-xs font-semibold text-brand hover:text-brand-dark"
              >
                <Mail className="size-3.5 shrink-0" aria-hidden="true" />
                {booking.email}
              </a>
              <a
                href={phoneHref(booking.phone)}
                className="flex items-center gap-2 text-xs font-semibold text-brand hover:text-brand-dark"
              >
                <Phone className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="numeric">{booking.phone}</span>
              </a>
            </div>
          </section>

          <section className="admin-card p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-3 border-b border-admin-line pb-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-brand-light text-brand">
                  <CalendarClock className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-ink-muted">
                    Preferred time
                  </p>
                  <p className="mt-1 text-sm font-semibold text-brand-dark">
                    {formatShortDate(booking.preferredDate)} ·{" "}
                    {timeLabels[booking.preferredTime] ?? booking.preferredTime}
                  </p>
                </div>
              </div>
              <p className="text-[0.625rem] font-bold uppercase tracking-[0.1em] text-ink-muted">
                Request — not confirmed
              </p>
            </div>

            <div className="mt-5">
              <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-ink-muted">
                Area of interest
              </p>
              <p className="mt-1 text-sm font-semibold text-brand-dark">
                {areaLabels[booking.areaOfInterest] ?? booking.areaOfInterest}
              </p>
            </div>

            <div className="mt-5 border-t border-admin-line pt-4">
              <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-ink-muted">
                Message
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-ink">
                {booking.message || "No additional message was provided."}
              </p>
            </div>

            <p className="mt-6 border-t border-admin-line pt-3 text-[0.625rem] text-ink-muted">
              Privacy notice accepted {formatDateTime(booking.privacyAcceptedAt)}.
            </p>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="admin-card p-5">
            <h2 className="text-sm font-bold text-brand-dark">Manage request</h2>
            <p className="mt-1 text-xs leading-5 text-ink-muted">
              Contact the visitor before marking a request as confirmed.
            </p>
            <div className="mt-4">
              <LeadStatusForm
                id={booking.id}
                initialStatus={booking.status}
                initialNotes={booking.adminNotes}
                statuses={[
                  { value: "NEW", label: "New" },
                  { value: "CONTACTED", label: "Contacted" },
                  { value: "CONFIRMED", label: "Confirmed" },
                  { value: "COMPLETED", label: "Completed" },
                  { value: "CANCELLED", label: "Cancelled" },
                ]}
                action={updateBookingAction}
                label="Save booking update"
              />
            </div>
          </section>

          <section className="admin-card p-5">
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-ink-muted">
              Appointment rule
            </p>
            <p className="mt-2 text-xs leading-5 text-ink-muted">
              A submitted form is only a request. Do not tell the visitor an appointment is
              confirmed until you have agreed a time with them.
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
