import Link from "next/link";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";

import { getSiteSettings } from "@/domains/site-settings/service";
import { FOOTER_COMPANY, FOOTER_SOLUTIONS, SITE } from "@/config/site";
import { phoneHref } from "@/lib/utils";

import { Logo } from "./logo";

export async function SiteFooter() {
  const settings = await getSiteSettings();
  const socials = [
    { href: settings.facebookUrl, label: "Facebook" },
    { href: settings.instagramUrl, label: "Instagram" },
    { href: settings.linkedinUrl, label: "LinkedIn" },
  ].filter((item): item is { href: string; label: string } => Boolean(item.href));

  return (
    <footer className="bg-brand-dark text-inverse">
      <div className="container-page">
        <div className="grid gap-12 border-b border-white/15 py-14 md:grid-cols-2 lg:grid-cols-12 lg:gap-8 lg:py-20">
          <div className="lg:col-span-5">
            <Link
              href="/"
              className="inline-flex items-center gap-4"
              aria-label="GIWESA Solutions home"
            >
              <Logo tone="dark" loading="eager" sizes="96px" className="size-20 md:size-24" />
              <span>
                <span className="block text-sm font-bold uppercase tracking-[0.2em] text-white">
                  GIWESA
                </span>
                <span className="mt-1 block font-display text-2xl text-white">
                  Solutions &amp; Welfare
                </span>
              </span>
            </Link>
            <p className="mt-6 max-w-sm text-[0.9375rem] leading-7 text-inverse-muted">
              A Kenyan microfinance organisation helping people save, borrow and protect what
              matters — with practical guidance at every step.
            </p>
            <p className="mt-6 font-display text-xl italic text-[#e7d6ad]">
              Empowering communities. Building prosperity.
            </p>
            {socials.length > 0 ? (
              <div className="mt-7 flex flex-wrap items-center gap-2">
                {socials.map(({ href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/20 px-3.5 text-[0.6875rem] font-semibold text-inverse-muted transition-colors hover:border-white/50 hover:text-white"
                  >
                    {label}
                    <ArrowUpRight className="size-3" aria-hidden="true" />
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <div className="lg:col-span-2">
            <h2 className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#e7d6ad]">
              Solutions
            </h2>
            <ul className="mt-5 space-y-3.5">
              {FOOTER_SOLUTIONS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-inverse-muted transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h2 className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#e7d6ad]">
              Company
            </h2>
            <ul className="mt-5 space-y-3.5">
              {FOOTER_COMPANY.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-inverse-muted transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h2 className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#e7d6ad]">
              Visit or call
            </h2>
            <address className="mt-5 space-y-4 not-italic">
              <p className="flex gap-3 text-sm leading-6 text-inverse-muted">
                <MapPin className="mt-0.5 size-4 shrink-0 text-[#e7d6ad]" aria-hidden="true" />
                <span>
                  <span className="block text-xs font-bold uppercase tracking-wider text-white">
                    Head office
                  </span>
                  {settings.address}
                </span>
              </p>
              <p>
                <a
                  href={phoneHref(settings.phone)}
                  className="flex items-center gap-3 text-sm text-inverse-muted transition-colors hover:text-white"
                >
                  <Phone className="size-4 shrink-0 text-[#e7d6ad]" aria-hidden="true" />
                  <span className="numeric">{settings.phone}</span>
                </a>
              </p>
              <p>
                <a
                  href={`mailto:${settings.email}`}
                  className="flex items-center gap-3 break-all text-sm text-inverse-muted transition-colors hover:text-white"
                >
                  <Mail className="size-4 shrink-0 text-[#e7d6ad]" aria-hidden="true" />
                  {settings.email}
                </a>
              </p>
              {settings.officeHours ? (
                <p className="text-xs leading-5 text-inverse-muted/80">{settings.officeHours}</p>
              ) : null}
            </address>
            <Link
              href="/book"
              className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-white"
            >
              <span className="link-underline">Book a consultation</span>
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-4 py-6 text-xs text-inverse-muted md:flex-row md:items-center md:justify-between">
          <p>© GIWESA Solutions. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/privacy" className="transition-colors hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-white">
              Website terms
            </Link>
            <a
              href={SITE.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 transition-colors hover:text-white"
            >
              www.giwesa.co.ke
              <ArrowUpRight className="size-3" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
