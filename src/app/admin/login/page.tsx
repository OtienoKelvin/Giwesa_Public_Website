import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { getCurrentAdmin } from "@/domains/auth/current";
import { SITE } from "@/config/site";
import { LoginForm } from "@/components/admin/login-form";
import { Logo } from "@/components/public/logo";

export const instant = false;

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; changed?: string }>;
}) {
  const admin = await getCurrentAdmin();
  if (admin) redirect("/admin");

  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;
  const passwordChanged = params.changed === "1";

  return (
    <main id="main-content" className="grid min-h-dvh bg-canvas lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-brand-dark p-10 text-inverse lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-24 size-[32rem] rounded-full border border-white/15"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-40 -left-20 size-[28rem] rounded-full border border-white/10"
        />
        <Link
          href="/"
          className="relative inline-flex items-center gap-4"
          aria-label="Back to GIWESA website"
        >
          <Logo tone="dark" sizes="88px" className="size-20" />
          <span>
            <span className="block text-xs font-bold uppercase tracking-[0.2em] text-white">
              GIWESA
            </span>
            <span className="mt-1 block font-display text-2xl text-white">
              Solutions &amp; Welfare
            </span>
          </span>
        </Link>

        <div className="relative max-w-md">
          <p className="eyebrow eyebrow-inverse">Staff area</p>
          <h1 className="mt-5 font-display text-5xl leading-[1.02] text-white xl:text-6xl">
            Keep the public site clear, current and useful.
          </h1>
          <p className="mt-5 text-[0.9375rem] leading-7 text-inverse-muted">
            Manage insights, products, inquiries and consultation requests from one focused
            workspace.
          </p>
          <div className="mt-8 flex items-center gap-3 border-t border-white/20 pt-5 text-xs font-semibold text-inverse-muted">
            <ShieldCheck className="size-4 text-[#e7d6ad]" aria-hidden="true" />
            Authorised staff only
          </div>
        </div>

        <p className="relative text-xs leading-5 text-inverse-muted">{SITE.legalName}</p>
      </section>

      <section className="flex items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden">
            <Link href="/" className="inline-flex items-center gap-3">
              <Logo sizes="64px" className="size-14" />
              <span>
                <span className="block text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-brand">
                  GIWESA
                </span>
                <span className="mt-0.5 block text-xs text-ink-muted">Solutions &amp; Welfare</span>
              </span>
            </Link>
          </div>

          <div className="mt-10 lg:mt-0">
            <p className="eyebrow">Admin</p>
            <h2 className="mt-4 font-display text-4xl leading-tight text-brand-dark sm:text-5xl">
              Sign in.
            </h2>
            <p className="mt-3 text-sm leading-6 text-ink-muted">
              Use the staff account provided by your GIWESA administrator.
            </p>
          </div>

          <div className="mt-8 rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow-soft-value)] sm:p-7">
            {passwordChanged ? (
              <p
                role="status"
                className="mb-5 rounded-lg border border-[#b9d8c3] bg-[#eef8f1] p-3 text-xs font-semibold leading-5 text-[#2e6b45]"
              >
                Password updated. Sign in again with your new password.
              </p>
            ) : null}
            <LoginForm next={next} />
          </div>

          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-ink-muted transition-colors hover:text-brand"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Back to the public website
          </Link>
        </div>
      </section>
    </main>
  );
}
