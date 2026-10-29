import Link from "next/link";
import { ArrowRight, ArrowUpRight, Mail, Phone } from "lucide-react";

import type { PublicSiteSettings } from "@/domains/site-settings/service";
import { phoneHref } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";

export function FinalCta({ settings }: { settings: PublicSiteSettings }) {
  return (
    <section className="relative overflow-hidden bg-brand text-white">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.13) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.13) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "linear-gradient(to right, black, transparent 75%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-48 right-[-5rem] size-[30rem] rounded-full border border-white/15 sm:size-[40rem]"
      />
      <div className="container-page section-space relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-20">
        <div>
          <p className="eyebrow eyebrow-inverse">Talk to GIWESA</p>
          <h2 className="mt-5 max-w-2xl font-display text-[2.8rem] leading-[1.02] text-white sm:text-5xl lg:text-[4rem]">
            The next step can be a conversation.
          </h2>
          <p className="mt-5 max-w-lg text-[1.0625rem] leading-8 text-inverse-muted">
            Bring your question, your goal or the decision you are weighing up. We will help you
            understand the options and what comes next.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <ButtonLink href="/book" variant="inverse" size="lg">
              Book a consultation
              <ArrowRight className="size-4" aria-hidden="true" />
            </ButtonLink>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-white"
            >
              <span className="link-underline">Send an inquiry</span>
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="border-t border-white/25 pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
          <p className="text-[0.625rem] font-bold uppercase tracking-[0.16em] text-[#e7d6ad]">
            Head office
          </p>
          <p className="mt-3 text-sm leading-6 text-inverse-muted">{settings.address}</p>
          <div className="mt-6 space-y-3">
            <a
              href={phoneHref(settings.phone)}
              className="flex items-center gap-3 text-sm font-semibold text-white transition-colors hover:text-[#e9d8b2]"
            >
              <Phone className="size-4 text-[#e7d6ad]" aria-hidden="true" />
              <span className="numeric">{settings.phone}</span>
            </a>
            <a
              href={`mailto:${settings.email}`}
              className="flex items-center gap-3 break-all text-sm font-semibold text-white transition-colors hover:text-[#e9d8b2]"
            >
              <Mail className="size-4 text-[#e7d6ad]" aria-hidden="true" />
              {settings.email}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
