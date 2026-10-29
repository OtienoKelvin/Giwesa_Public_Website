import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Phone } from "lucide-react";

import { PageHeader } from "@/components/public/page-header";
import { SolutionsList } from "@/components/public/home/solutions-list";
import { FinalCta } from "@/components/public/home/final-cta";
import { getPublicProducts } from "@/domains/products/service";
import { getSiteSettings } from "@/domains/site-settings/service";
import { JsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { phoneHref } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Savings, loans and welfare solutions",
  description:
    "Explore GIWESA Solutions: savings and savings-linked micro-loans, welfare protection, and community development partnerships.",
  alternates: { canonical: "/solutions" },
  openGraph: {
    title: "Savings, loans and welfare solutions | GIWESA",
    description:
      "Savings and micro-loans, welfare protection, and community development support from GIWESA Solutions.",
    url: "/solutions",
  },
};

export default async function SolutionsPage() {
  const [products, settings] = await Promise.all([getPublicProducts(), getSiteSettings()]);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Solutions", path: "/solutions" },
        ])}
      />
      <PageHeader
        eyebrow="Our solutions"
        title="Practical ways to build financial stability."
        description="Savings and credit, welfare protection and community partnerships. Each solution is designed to be understood before it is used."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Solutions" }]}
        aside={
          <div className="rounded-2xl border border-line bg-paper p-6">
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.16em] text-leaf-dark">
              Not sure where to start?
            </p>
            <p className="mt-3 font-display text-2xl leading-snug text-brand-dark">
              Tell us what you are working towards.
            </p>
            <p className="mt-2 text-sm leading-6 text-ink-muted">
              We will help you understand which option fits, and what the current terms are.
            </p>
            <div className="mt-5 flex flex-wrap gap-4">
              <Link
                href="/book"
                className="inline-flex min-h-10 items-center gap-2 rounded-full bg-brand px-4 text-xs font-bold text-white hover:bg-brand-dark"
              >
                Book a consultation
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </Link>
              <a
                href={phoneHref(settings.phone)}
                className="inline-flex min-h-10 items-center gap-2 text-xs font-bold text-brand"
              >
                <Phone className="size-3.5 text-leaf-dark" aria-hidden="true" />
                <span className="numeric">{settings.phone}</span>
              </a>
            </div>
          </div>
        }
      />

      <section className="bg-canvas">
        <div className="container-page section-space">
          {products.length > 0 ? (
            <SolutionsList products={products} />
          ) : (
            <div className="rounded-2xl border border-dashed border-line-strong bg-paper p-8">
              <p className="font-display text-2xl text-brand-dark">
                Solution information is being updated.
              </p>
              <p className="mt-2 text-sm leading-6 text-ink-muted">
                Please contact the GIWESA team for current information.
              </p>
              <Link
                href="/contact"
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand"
              >
                <span className="link-underline">Contact GIWESA</span>
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="border-y border-line bg-paper">
        <div className="container-page section-space grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <p className="eyebrow">How it connects</p>
            <h2 className="mt-5 font-display text-[2.5rem] leading-[1.05] text-brand-dark sm:text-5xl">
              One plan can touch more than one need.
            </h2>
            <p className="mt-5 max-w-md text-[1.0625rem] leading-8 text-ink-muted">
              A savings habit can support a future loan. A welfare plan protects the household while
              that plan is being built. Community partnerships can widen access for more people.
            </p>
          </div>
          <div className="lg:col-span-7">
            <ol className="space-y-0">
              {[
                {
                  title: "Start with savings",
                  body: "Consistent saving builds a record and creates room to choose.",
                  href: "/solutions/savings-and-loans",
                  link: "Savings & micro-loans",
                },
                {
                  title: "Protect the household",
                  body: "A defined welfare plan helps families prepare for the unexpected.",
                  href: "/solutions/welfare-protection",
                  link: "Welfare protection",
                },
                {
                  title: "Grow with the community",
                  body: "Partnerships can extend financial inclusion, enterprise and education.",
                  href: "/solutions/community-development",
                  link: "Community development",
                },
              ].map((item, index) => (
                <li
                  key={item.title}
                  className="grid gap-3 border-t border-line py-6 last:border-b sm:grid-cols-[2.5rem_1fr_auto] sm:items-center"
                >
                  <span className="font-display text-2xl text-line-strong">0{index + 1}</span>
                  <div>
                    <p className="font-sans text-lg font-bold tracking-normal text-brand-dark">
                      {item.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-ink-muted">{item.body}</p>
                  </div>
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand"
                  >
                    {item.link}
                    <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <FinalCta settings={settings} />
    </>
  );
}
