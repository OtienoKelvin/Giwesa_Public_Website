import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { requireAdministratorPage } from "@/domains/auth/current";
import { ADMIN_ROLE_LABELS } from "@/domains/auth/types";
import { getAdminSettings, getSiteSettings } from "@/domains/site-settings/service";
import { siteUrl } from "@/config/env";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const admin = await requireAdministratorPage();
  const [stored, fallback] = await Promise.all([getAdminSettings(), getSiteSettings()]);

  const initial = {
    phone: stored?.phone ?? fallback.phone,
    email: stored?.email ?? fallback.email,
    address: stored?.address ?? fallback.address,
    officeHours: stored?.officeHours ?? "",
    facebookUrl: stored?.facebookUrl ?? "",
    instagramUrl: stored?.instagramUrl ?? "",
    linkedinUrl: stored?.linkedinUrl ?? "",
    xUrl: stored?.xUrl ?? "",
    heroEyebrow: stored?.heroEyebrow ?? fallback.heroEyebrow,
    heroTitle: stored?.heroTitle ?? fallback.heroTitle,
    heroDescription: stored?.heroDescription ?? fallback.heroDescription,
  };

  return (
    <>
      <AdminPageHeader
        title="Website settings"
        description="Contact details, social links and the homepage hero. Changes publish immediately to the public site."
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_18rem]">
        <SettingsForm initial={initial} />

        <aside className="space-y-5">
          <section className="admin-card p-5">
            <h2 className="text-sm font-bold text-brand-dark">Signed-in account</h2>
            <dl className="mt-4 space-y-3 text-xs">
              <div>
                <dt className="text-ink-muted">Name</dt>
                <dd className="mt-0.5 font-semibold text-brand-dark">{admin.name}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Email</dt>
                <dd className="mt-0.5 break-all font-semibold text-brand-dark">{admin.email}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Role</dt>
                <dd className="mt-0.5 inline-flex items-center gap-1.5 font-semibold text-brand-dark">
                  <ShieldCheck className="size-3.5 text-leaf-dark" aria-hidden="true" />
                  {ADMIN_ROLE_LABELS[admin.role]}
                </dd>
              </div>
            </dl>
            <p className="mt-4 border-t border-admin-line pt-3 text-[0.625rem] leading-5 text-ink-muted">
              Admin accounts are created through the controlled seed/bootstrap process. There is no
              public registration.
            </p>
            <Link
              href="/admin/settings/security"
              className="mt-3 inline-flex items-center gap-1.5 text-[0.6875rem] font-bold text-brand hover:text-brand-dark"
            >
              Change password
            </Link>
          </section>

          <section className="admin-card p-5">
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-ink-muted">
              Public site
            </p>
            <a
              href={siteUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 block break-all text-xs font-bold text-brand underline underline-offset-2"
            >
              {siteUrl}
            </a>
            <p className="mt-3 text-[0.625rem] leading-5 text-ink-muted">
              Analytics and marketing scripts are not enabled on this website.
            </p>
          </section>

          <section className="admin-card p-5">
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-ink-muted">
              Legal content
            </p>
            <p className="mt-2 text-xs leading-5 text-ink-muted">
              Privacy and website terms are currently working drafts and are not editable here. They
              require GIWESA and legal sign-off before being treated as final.
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
