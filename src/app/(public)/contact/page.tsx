import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Clock, Mail, MapPin, Phone } from "lucide-react";

import { JsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { getSiteSettings } from "@/domains/site-settings/service";
import { phoneHref } from "@/lib/utils";
import { PageHeader } from "@/components/public/page-header";
import { InquiryForm } from "@/components/public/forms/inquiry-form";

export const metadata: Metadata = {
  title: "Contact GIWESA Solutions",
  description:
    "Send an inquiry to GIWESA Solutions or contact our Homa Bay head office about savings, micro-loans, welfare protection or partnerships.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact GIWESA Solutions",
    description:
      "Ask about savings, micro-loans, welfare protection or partnerships. Contact our Homa Bay team.",
    url: "/contact",
  },
};

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />
      <PageHeader
        eyebrow="Contact"
        title="Start with a question."
        description="Whether you are exploring a solution, checking a term or bringing a partnership idea, the GIWESA team is ready to listen."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Contact" }]}
      />

      <section className="bg-canvas" id="inquiry-form">
        <div className="container-page section-space grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <p className="eyebrow">Reach the team</p>
            <h2 className="mt-5 font-display text-[2.4rem] leading-[1.05] text-brand-dark sm:text-5xl">
              A real person, at the other end.
            </h2>
            <p className="mt-5 max-w-md text-[1.0625rem] leading-8 text-ink-muted">
              Use the details below or send the form. We will respond using the contact method you
              provide.
            </p>

            <div className="mt-9 space-y-6 border-y border-line py-7">
              <div className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand">
                  <Phone className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-ink-muted">
                    Call
                  </p>
                  <a
                    href={phoneHref(settings.phone)}
                    className="mt-1 block font-display text-2xl text-brand-dark transition-colors hover:text-brand"
                  >
                    <span className="numeric">{settings.phone}</span>
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand">
                  <Mail className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-ink-muted">
                    Email
                  </p>
                  <a
                    href={`mailto:${settings.email}`}
                    className="mt-1 block break-all text-sm font-bold text-brand-dark transition-colors hover:text-brand"
                  >
                    {settings.email}
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand">
                  <MapPin className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-ink-muted">
                    Head office
                  </p>
                  <p className="mt-1 max-w-sm text-sm leading-6 text-brand-dark">
                    {settings.address}
                  </p>
                </div>
              </div>

              {settings.officeHours ? (
                <div className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand">
                    <Clock className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-ink-muted">
                      Office hours
                    </p>
                    <p className="mt-1 text-sm leading-6 text-brand-dark">{settings.officeHours}</p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-7 rounded-2xl border border-line bg-paper p-5">
              <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-leaf-dark">
                Prefer a scheduled conversation?
              </p>
              <p className="mt-2 text-sm leading-6 text-ink-muted">
                Request a consultation and tell us when you would prefer to talk.
              </p>
              <Link
                href="/book"
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand"
              >
                <span className="link-underline">Book a consultation</span>
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow-soft-value)] sm:p-8">
              <div className="border-b border-line pb-5">
                <p className="eyebrow">Send an inquiry</p>
                <p className="mt-3 text-sm leading-6 text-ink-muted">
                  Tell us what you need help with. We will respond using the contact details you
                  provide.
                </p>
              </div>
              <div className="mt-6">
                <InquiryForm />
              </div>
            </div>
            <p className="mt-4 text-center text-[0.6875rem] leading-5 text-ink-muted">
              Inquiries are stored securely and are not published. Please do not send passwords,
              PINs or account numbers.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
