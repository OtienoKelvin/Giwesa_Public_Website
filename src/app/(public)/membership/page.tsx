import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BadgeCheck, FileCheck2, Phone, ShieldCheck, Wallet } from "lucide-react";

import { PageHeader } from "@/components/public/page-header";
import { MembershipRegistrationForm } from "@/components/public/forms/membership-registration-form";
import { getSiteSettings } from "@/domains/site-settings/service";
import { SITE } from "@/config/site";
import { JsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { phoneHref } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Become a member",
  description:
    "Apply for GIWESA Solutions membership online. No account needed — complete the application, upload your National ID and a passport photo, and pay the registration fee by M-Pesa or later.",
  alternates: { canonical: "/membership" },
  openGraph: {
    title: "Become a GIWESA member",
    description: "Apply for GIWESA Solutions membership online. No account or login is needed.",
    url: "/membership",
  },
};

const STEPS = [
  {
    icon: FileCheck2,
    title: "Complete the application",
    body: "Your details, contact information and next of kin. About ten minutes.",
  },
  {
    icon: ShieldCheck,
    title: "Upload your documents",
    body: "A copy of your National ID and a passport-size photograph are required.",
  },
  {
    icon: Wallet,
    title: "Choose how to pay",
    body: "Pay now with M-Pesa, pay by PayBill, or pay later while your application is reviewed.",
  },
  {
    icon: BadgeCheck,
    title: "We review and approve",
    body: "Our team reviews your application and emails you once a decision is made.",
  },
] as const;

export default async function MembershipPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Become a member", path: "/membership" },
        ])}
      />
      <PageHeader
        eyebrow="Membership"
        title="Become a GIWESA member."
        description="Apply online in a few minutes. No account, no login, no visit to the office needed to get started — and our team will walk you through the rest."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Become a member" }]}
      />

      <section className="bg-canvas">
        <div className="container-page section-space grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <p className="eyebrow">Before you begin</p>
            <h2 className="mt-5 font-display text-[2.4rem] leading-[1.05] text-brand-dark sm:text-5xl">
              Everything in one application.
            </h2>
            <p className="mt-5 max-w-md text-[1.0625rem] leading-8 text-ink-muted">
              This form goes straight into the same membership process our team uses in the office.
              You do not need to create an account, and you can complete it from your phone.
            </p>

            <ol className="mt-9 divide-y divide-line border-y border-line">
              {STEPS.map((step, index) => (
                <li key={step.title} className="flex gap-4 py-5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-leaf-light text-leaf-dark">
                    <step.icon className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[0.625rem] font-bold tracking-[0.15em] text-ink-muted">
                      0{index + 1}
                    </p>
                    <p className="mt-1 text-sm font-bold text-brand-dark">{step.title}</p>
                    <p className="mt-1 text-sm leading-6 text-ink-muted">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-8 rounded-2xl border border-line bg-white p-5">
              <p className="text-[0.625rem] font-bold uppercase tracking-[0.18em] text-ink-muted">
                What you will need
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-ink">
                <li>• Your National ID or passport, and a photo or scan of it.</li>
                <li>• A recent passport-size photograph of yourself.</li>
                <li>• An email address so we can send your reference and decision.</li>
                <li>• An M-Pesa phone number, if you would like to pay now.</li>
              </ul>
              <p className="mt-3 text-xs leading-5 text-ink-muted">
                A postal address, next of kin and business details are optional, but they help us
                complete your membership record.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
              <a
                href={phoneHref(settings.phone)}
                className="inline-flex items-center gap-2 font-bold text-brand"
              >
                <Phone className="size-4 text-leaf-dark" aria-hidden="true" />
                <span className="numeric">{settings.phone}</span>
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 font-bold text-brand"
              >
                <span className="link-underline">Ask a question first</span>
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7">
            <MembershipRegistrationForm />
            <p className="mt-4 text-center text-[0.6875rem] leading-5 text-ink-muted">
              Your information and documents are used only to process your membership application.
              Read the{" "}
              <Link href="/privacy" className="font-bold text-brand underline underline-offset-2">
                privacy notice
              </Link>
              . GIWESA will never ask for your M-Pesa PIN.
            </p>
            <p className="mt-2 text-center text-[0.6875rem] leading-5 text-ink-muted">
              Prefer to speak to someone? Call {SITE.defaultPhone} or visit our office in{" "}
              {settings.address}.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
