import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireAdminPage } from "@/domains/auth/current";
import { ChangePasswordForm } from "@/components/admin/change-password-form";

export const metadata: Metadata = { title: "Security" };

export default async function AdminSecurityPage() {
  await requireAdminPage();
  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/admin/settings"
        className="mb-4 inline-flex items-center gap-1.5 text-[0.6875rem] font-bold text-ink-muted hover:text-brand"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Back to settings
      </Link>
      <h1 className="font-display text-[2rem] leading-tight text-brand-dark sm:text-4xl">
        Account security
      </h1>
      <p className="mb-6 mt-2 max-w-md text-sm leading-6 text-ink-muted">
        Use a unique password that is not used anywhere else. After changing it, you will be asked
        to sign in again.
      </p>
      <ChangePasswordForm />
    </div>
  );
}
