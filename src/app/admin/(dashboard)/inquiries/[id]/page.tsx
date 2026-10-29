import { notFound } from "next/navigation";
import { Mail, Phone } from "lucide-react";

import { requireLeadManagerPage } from "@/domains/auth/current";
import { getAdminInquiry } from "@/domains/inquiries/service";
import { INQUIRY_SUBJECTS } from "@/config/site";
import { formatDateTime } from "@/lib/dates";
import { phoneHref } from "@/lib/utils";
import { AdminPageHeader, StatusBadge } from "@/components/admin/admin-ui";
import { LeadStatusForm } from "@/components/admin/lead-status-form";
import { updateInquiryAction } from "../actions";

const subjectLabels: Record<string, string> = Object.fromEntries(
  INQUIRY_SUBJECTS.map((subject) => [subject.value, subject.label]),
);

export default async function AdminInquiryPage({ params }: { params: Promise<{ id: string }> }) {
  await requireLeadManagerPage();
  const { id } = await params;
  const inquiry = await getAdminInquiry(id);
  if (!inquiry) notFound();

  return (
    <>
      <AdminPageHeader
        title="Inquiry detail"
        description={`Received ${formatDateTime(inquiry.createdAt)}`}
        backHref="/admin/inquiries"
        action={<StatusBadge status={inquiry.status} />}
      />

      <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-5">
          <section className="admin-card p-5 sm:p-6">
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-ink-muted">
              Visitor
            </p>
            <h2 className="mt-2 font-display text-3xl text-brand-dark">{inquiry.name}</h2>
            <div className="mt-4 grid gap-3 border-t border-admin-line pt-4 sm:grid-cols-2">
              <a
                href={`mailto:${inquiry.email}`}
                className="flex items-center gap-2 break-all text-xs font-semibold text-brand hover:text-brand-dark"
              >
                <Mail className="size-3.5 shrink-0" aria-hidden="true" />
                {inquiry.email}
              </a>
              <a
                href={phoneHref(inquiry.phone)}
                className="flex items-center gap-2 text-xs font-semibold text-brand hover:text-brand-dark"
              >
                <Phone className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="numeric">{inquiry.phone}</span>
              </a>
            </div>
          </section>

          <section className="admin-card p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-admin-line pb-3">
              <div>
                <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-ink-muted">
                  Subject
                </p>
                <p className="mt-1 text-sm font-semibold text-brand-dark">
                  {subjectLabels[inquiry.subject] ?? inquiry.subject}
                </p>
              </div>
              <p className="numeric text-[0.6875rem] text-ink-muted">
                {formatDateTime(inquiry.createdAt)}
              </p>
            </div>
            <div className="mt-5 whitespace-pre-wrap text-sm leading-7 text-ink">
              {inquiry.message}
            </div>
            <p className="mt-6 border-t border-admin-line pt-3 text-[0.625rem] text-ink-muted">
              Privacy notice accepted {formatDateTime(inquiry.privacyAcceptedAt)}.
            </p>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="admin-card p-5">
            <h2 className="text-sm font-bold text-brand-dark">Manage inquiry</h2>
            <p className="mt-1 text-xs leading-5 text-ink-muted">
              The visitor cannot see these notes or the internal status.
            </p>
            <div className="mt-4">
              <LeadStatusForm
                id={inquiry.id}
                initialStatus={inquiry.status}
                initialNotes={inquiry.adminNotes}
                statuses={[
                  { value: "NEW", label: "New" },
                  { value: "CONTACTED", label: "Contacted" },
                  { value: "RESOLVED", label: "Resolved" },
                  { value: "ARCHIVED", label: "Archived" },
                ]}
                action={updateInquiryAction}
              />
            </div>
          </section>

          <section className="admin-card p-5">
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-ink-muted">
              Privacy reminder
            </p>
            <p className="mt-2 text-xs leading-5 text-ink-muted">
              This inquiry contains personal information. Do not copy it into public channels or
              forward it outside the team without a business need.
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
