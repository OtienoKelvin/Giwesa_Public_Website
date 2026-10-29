import Link from "next/link";
import { ArrowRight, ArrowUpRight, Phone } from "lucide-react";

import type { PublicSiteSettings } from "@/domains/site-settings/service";
import { phoneHref } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";

const steps = [
  {
    number: "01",
    title: "Tell us what you are working towards",
    body: "A business goal, a family plan, a question about welfare. Send an inquiry or request a consultation and start with your own words.",
    meta: "A conversation, not a sales pitch",
  },
  {
    number: "02",
    title: "Choose the fit with a real person",
    body: "We explain the options and the current terms in plain language, then help you decide what makes sense for your situation.",
    meta: "Clear terms before you commit",
  },
  {
    number: "03",
    title: "Move at a pace you can sustain",
    body: "Build a savings habit, plan a repayment, or put family protection in place — with support you can return to.",
    meta: "A relationship that continues",
  },
];

export function HowItWorks({ settings }: { settings: PublicSiteSettings }) {
  return (
    <section className="border-b border-line bg-paper">
      <div className="container-page section-space grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <p className="eyebrow">Getting started</p>
          <h2 className="mt-5 font-display text-[2.5rem] leading-[1.05] text-brand-dark sm:text-5xl">
            A simple way in.
          </h2>
          <p className="mt-5 max-w-md text-[1.0625rem] leading-8 text-ink-muted">
            You do not need to arrive with a finished plan. Start with a conversation, ask the
            questions that matter to you, and take the next step when you are ready.
          </p>

          <div className="mt-7">
            <ButtonLink href="/book" size="lg">
              Book a consultation
              <ArrowRight className="size-4" aria-hidden="true" />
            </ButtonLink>
          </div>

          <div className="mt-8 rounded-2xl border border-line bg-canvas p-5">
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.16em] text-leaf-dark">
              Prefer to speak first?
            </p>
            <a
              href={phoneHref(settings.phone)}
              className="mt-2 inline-flex items-center gap-2 font-display text-2xl text-brand-dark hover:text-brand"
            >
              <Phone className="size-4" aria-hidden="true" />
              <span className="numeric">{settings.phone}</span>
            </a>
            <p className="mt-2 text-xs leading-5 text-ink-muted">
              Speak to the GIWESA team at our Homa Bay head office.
            </p>
          </div>
        </div>

        <ol className="relative">
          <div
            aria-hidden="true"
            className="absolute bottom-6 left-[1.4375rem] top-6 w-px bg-line md:left-8"
          />
          {steps.map((step) => (
            <li
              key={step.number}
              className="relative grid grid-cols-[3rem_1fr] gap-5 pb-12 last:pb-0 md:grid-cols-[4rem_1fr] md:gap-7"
            >
              <span className="relative z-10 flex size-12 items-center justify-center rounded-full border border-line-strong bg-white font-sans text-[0.6875rem] font-bold tracking-[0.1em] text-brand md:size-16">
                {step.number}
              </span>
              <div className="pt-1 md:pt-2">
                <p className="text-[0.625rem] font-bold uppercase tracking-[0.15em] text-leaf-dark">
                  {step.meta}
                </p>
                <h3 className="mt-2 font-display text-[1.75rem] leading-[1.18] text-brand-dark sm:text-[2rem]">
                  {step.title}
                </h3>
                <p className="mt-3 max-w-xl text-[0.9375rem] leading-7 text-ink-muted">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
          <li className="relative ml-[3.75rem] md:ml-[5.75rem]">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-sm font-bold text-brand"
            >
              <span className="link-underline">Send us an inquiry instead</span>
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </li>
        </ol>
      </div>
    </section>
  );
}
