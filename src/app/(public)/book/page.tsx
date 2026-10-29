import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CalendarCheck2, MessageSquare, Phone } from "lucide-react";

import { JsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { getSiteSettings } from "@/domains/site-settings/service";
import { phoneHref } from "@/lib/utils";
import { PageHeader } from "@/components/public/page-header";
import { BookingForm } from "@/components/public/forms/booking-form";

export const metadata: Metadata = {
  title: "Book a consultation",
  description:
    "Request a consultation with GIWESA Solutions about savings, micro-loans, welfare protection or community partnerships.",
  alternates: { canonical: "/book" },
  openGraph: {
    title: "Book a consultation | GIWESA Solutions",
    description:
      "Request a conversation with GIWESA about savings, micro-loans, welfare protection or partnerships.",
    url: "/book",
  },
};

const steps = [
  {
    icon: MessageSquare,
    title: "Tell us what matters",
    body: "Choose an area of interest and share a little context. A sentence is enough to begin.",
  },
  {
    icon: CalendarCheck2,
    title: "Request a preferred time",
    body: "Select a date and period that suits you. The team will confirm the actual appointment with you.",
  },
  {
    icon: Phone,
    title: "Talk it through",
    body: "A conversation about your question, the options and what the current terms mean for you.",
  },
];

export default async function BookPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Book a consultation", path: "/book" },
        ])}
      />
      <PageHeader
        eyebrow="Book a consultation"
        title="A conversation, at a time that works."
        description="Tell us what you would like to discuss and when you would prefer to talk. This is a request — our team will contact you to agree the appointment."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Book a consultation" }]}
      />

      <section className="bg-canvas">
        <div className="container-page section-space grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <p className="eyebrow">What to expect</p>
            <h2 className="mt-5 font-display text-[2.4rem] leading-[1.05] text-brand-dark sm:text-5xl">
              No pressure. Just a useful conversation.
            </h2>
            <p className="mt-5 max-w-md text-[1.0625rem] leading-8 text-ink-muted">
              You do not need to have everything worked out. Bring your question, your goal or the
              decision you are weighing up.
            </p>

            <ol className="mt-9 divide-y divide-line border-y border-line">
              {steps.map((step, index) => (
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

            <div className="mt-7 flex flex-wrap items-center gap-4 text-sm">
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
                <span className="link-underline">Send a general inquiry</span>
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow-soft-value)] sm:p-8">
              <div className="border-b border-line pb-5">
                <p className="eyebrow">Consultation request</p>
                <p className="mt-3 text-sm leading-6 text-ink-muted">
                  This does not create a confirmed appointment. We will contact you to agree the
                  final time.
                </p>
              </div>
              <div className="mt-6">
                <BookingForm />
              </div>
            </div>
            <p className="mt-4 text-center text-[0.6875rem] leading-5 text-ink-muted">
              Your details are private. Please do not include passwords, PINs or account numbers.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
