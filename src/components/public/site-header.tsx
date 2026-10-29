import Link from "next/link";

import { getSiteSettings } from "@/domains/site-settings/service";
import { phoneHref } from "@/lib/utils";

import { Logo } from "./logo";
import { SiteNavigation } from "./site-navigation";

export async function SiteHeader() {
  const settings = await getSiteSettings();

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-canvas/95 backdrop-blur-md">
      <div className="container-page flex h-[76px] items-center justify-between gap-5 md:h-[88px]">
        <Link
          href="/"
          className="group inline-flex items-center gap-3 rounded-xl focus-visible:outline-offset-4"
          aria-label="GIWESA Solutions home"
        >
          <Logo
            priority
            sizes="(min-width: 768px) 64px, 52px"
            className="size-13 shadow-[0_1px_0_rgba(20,43,59,0.08)] transition-transform duration-200 group-hover:-rotate-1 md:size-16"
          />
          <span className="hidden border-l border-line pl-3 xl:block">
            <span className="block text-[0.6875rem] font-bold uppercase tracking-[0.17em] text-brand">
              GIWESA
            </span>
            <span className="mt-0.5 block text-[0.6875rem] font-medium tracking-[0.05em] text-ink-muted">
              Solutions &amp; Welfare
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <SiteNavigation phone={settings.phone} phoneHref={phoneHref(settings.phone)} />
        </div>
      </div>
    </header>
  );
}
