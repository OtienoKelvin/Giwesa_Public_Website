import Link from "next/link";
import { ArrowRight, ArrowUpRight, MapPin, ShieldCheck } from "lucide-react";

import type { PublicSiteSettings } from "@/domains/site-settings/service";
import { Logo } from "@/components/public/logo";
import { ButtonLink } from "@/components/ui/button";

const steps = [
  {
    number: "01",
    title: "Save with a rhythm",
    body: "Build a steady savings record, one transfer at a time.",
  },
  {
    number: "02",
    title: "Borrow with a plan",
    body: "Explore credit linked to the savings you have built.",
  },
  {
    number: "03",
    title: "Protect your family",
    body: "Put practical welfare support in place before it is needed.",
  },
];

export function HomeHero({ settings }: { settings: PublicSiteSettings }) {
  return (
    <section className="paper-glow relative overflow-hidden border-b border-line">
      <div
        aria-hidden="true"
        className="paper-grid pointer-events-none absolute inset-0 opacity-70 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
      />
      <div className="container-page relative grid gap-14 py-14 sm:py-16 lg:grid-cols-[1.04fr_0.96fr] lg:items-center lg:gap-12 lg:py-20 xl:py-24">
        <div className="max-w-2xl fade-up">
          <p className="eyebrow">{settings.heroEyebrow}</p>
          <h1 className="mt-6 font-display text-[clamp(2.75rem,6.1vw,5rem)] leading-[0.98] tracking-[-0.035em] text-brand-dark">
            {settings.heroTitle}
          </h1>
          <p className="mt-6 max-w-xl text-[1.0625rem] leading-8 text-ink-muted sm:text-lg">
            {settings.heroDescription}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonLink href="/solutions" size="lg" className="justify-between sm:justify-center">
              Explore our solutions
              <ArrowRight
                className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </ButtonLink>
            <ButtonLink href="/contact" variant="secondary" size="lg">
              Talk to GIWESA
            </ButtonLink>
          </div>

          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-2.5 border-t border-line/80 pt-5 text-xs font-semibold text-ink-muted">
            <span className="inline-flex items-center gap-2">
              <MapPin className="size-3.5 text-leaf-dark" aria-hidden="true" />
              Head office in Homa Bay
            </span>
            <span
              className="hidden size-1 rounded-full bg-line-strong sm:block"
              aria-hidden="true"
            />
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="size-3.5 text-leaf-dark" aria-hidden="true" />
              Savings, loans and welfare in one place
            </span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[34rem] fade-up fade-up-delay-2 lg:mr-0">
          <div
            aria-hidden="true"
            className="absolute -top-8 right-10 hidden size-52 rounded-full border border-leaf/25 sm:block"
          />
          <div
            aria-hidden="true"
            className="absolute -right-5 top-24 hidden h-32 w-32 rounded-full bg-sun/15 blur-2xl sm:block"
          />

          <div className="relative overflow-hidden rounded-[2rem] border border-brand-dark/20 bg-brand-dark p-5 text-white shadow-[0_30px_80px_-35px_rgba(1,43,86,0.55)] sm:p-6">
            <div className="relative z-10 flex items-center justify-between gap-4 border-b border-white/15 pb-5">
              <div className="flex items-center gap-3">
                <Logo tone="dark" sizes="64px" className="size-14" />
                <div>
                  <p className="text-[0.625rem] font-bold uppercase tracking-[0.18em] text-[#e7d6ad]">
                    GIWESA at a glance
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    Practical finance. Human guidance.
                  </p>
                </div>
              </div>
              <span className="hidden rounded-full border border-white/20 px-3 py-1.5 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-inverse-muted sm:inline-flex">
                Kenya
              </span>
            </div>

            <div className="relative z-10 pb-4 pt-7">
              <p className="font-display text-[2.2rem] leading-[1.05] text-white sm:text-[2.75rem]">
                A plan. A habit.
                <br />
                <em className="text-[#e9d8b2]">A way forward.</em>
              </p>

              <ol className="mt-8 space-y-0">
                {steps.map((step, index) => (
                  <li
                    key={step.number}
                    className={`grid grid-cols-[2.25rem_1fr] gap-3 py-4 ${
                      index > 0 ? "border-t border-white/15" : ""
                    }`}
                  >
                    <span className="pt-0.5 font-sans text-[0.625rem] font-bold tracking-[0.14em] text-[#e7d6ad]">
                      {step.number}
                    </span>
                    <div>
                      <p className="font-sans text-sm font-bold text-white">{step.title}</p>
                      <p className="mt-1 text-[0.8125rem] leading-6 text-inverse-muted">
                        {step.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="relative z-10 flex flex-wrap items-center gap-2 border-t border-white/15 pt-5">
              {["Savings", "Micro-loans", "Welfare"].map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[0.6875rem] font-semibold text-inverse-muted"
                >
                  {label}
                </span>
              ))}
            </div>

            <svg
              aria-hidden="true"
              viewBox="0 0 400 400"
              className="pointer-events-none absolute -bottom-24 -right-24 size-80 text-white/10"
            >
              <circle
                cx="200"
                cy="200"
                r="150"
                fill="none"
                stroke="currentColor"
                strokeWidth="32"
              />
              <circle cx="200" cy="200" r="95" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
            <div
              aria-hidden="true"
              className="absolute -left-16 top-1/3 h-40 w-40 rounded-full bg-leaf/15 blur-3xl"
            />
          </div>

          <Link
            href="/book"
            className="group relative -mt-5 ml-3 flex w-[calc(100%-1.5rem)] items-center justify-between gap-4 rounded-2xl border border-line bg-white p-4 shadow-[var(--shadow-lift-value)] transition-transform duration-200 hover:-translate-y-1 sm:-mt-7 sm:ml-8 sm:w-[min(24rem,calc(100%-2rem))]"
          >
            <span>
              <span className="block text-[0.625rem] font-bold uppercase tracking-[0.16em] text-leaf-dark">
                Start with a conversation
              </span>
              <span className="mt-1 block font-display text-xl text-brand-dark">
                Book a consultation
              </span>
            </span>
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand transition-colors group-hover:bg-brand group-hover:text-white">
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
