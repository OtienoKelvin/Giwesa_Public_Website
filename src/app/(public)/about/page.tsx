import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Building2, Compass, HeartHandshake, MapPin, Sprout } from "lucide-react";

import { PageHeader } from "@/components/public/page-header";
import { SectionHeading } from "@/components/public/section-heading";
import { FinalCta } from "@/components/public/home/final-cta";
import { getSiteSettings } from "@/domains/site-settings/service";
import { JsonLd, breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "About GIWESA Solutions",
  description:
    "Learn who GIWESA Solutions is, what guides our work, and how we support financial inclusion, enterprise, education and welfare in Kenya.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About GIWESA Solutions",
    description:
      "A Kenyan enterprise working to connect opportunity with access through financial inclusion, enterprise, education and welfare.",
    url: "/about",
  },
};

const values = [
  {
    name: "Dignity",
    body: "Every person deserves to be met with respect, patience and a conversation that starts with their situation.",
  },
  {
    name: "Clarity",
    body: "We explain the terms, the steps and the cost before asking anyone to make a commitment.",
  },
  {
    name: "Community",
    body: "Progress is stronger when it is shared. We think about households, enterprises and the places they belong to.",
  },
  {
    name: "Stewardship",
    body: "Money carries trust. We take care with the resources and information people place in our hands.",
  },
  {
    name: "Partnership",
    body: "We work with people, institutions and communities, not around them.",
  },
];

export default async function AboutPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />
      <PageHeader
        eyebrow="About GIWESA"
        title="Built around access, opportunity and people."
        description="GIWESA Solutions is a Kenyan microfinance organisation working to bridge the gap between opportunity and access through financial inclusion, enterprise development, education, welfare and consultancy."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "About" }]}
        aside={
          <div className="rounded-2xl border border-line bg-paper p-6 shadow-[var(--shadow-soft-value)]">
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.16em] text-leaf-dark">
              At a glance
            </p>
            <div className="mt-5 space-y-5">
              <div className="flex gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
                <div>
                  <p className="text-xs font-bold text-brand-dark">Head office</p>
                  <p className="mt-1 text-xs leading-5 text-ink-muted">{settings.address}</p>
                </div>
              </div>
              <div className="flex gap-3 border-t border-line pt-5">
                <Sprout className="mt-0.5 size-4 shrink-0 text-leaf-dark" aria-hidden="true" />
                <div>
                  <p className="text-xs font-bold text-brand-dark">Focus</p>
                  <p className="mt-1 text-xs leading-5 text-ink-muted">
                    Financial inclusion · Enterprise · Education · Welfare · Consultancy
                  </p>
                </div>
              </div>
              <div className="flex gap-3 border-t border-line pt-5">
                <Compass className="mt-0.5 size-4 shrink-0 text-sun" aria-hidden="true" />
                <div>
                  <p className="text-xs font-bold text-brand-dark">Vision</p>
                  <p className="mt-1 text-xs leading-5 text-ink-muted">
                    To become a leading African organisation delivering innovative financial,
                    educational, enterprise, and community development solutions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        }
      />

      <section className="bg-canvas">
        <div className="container-page section-space grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <p className="eyebrow">Who we are</p>
            <h2 className="mt-5 font-display text-[2.5rem] leading-[1.05] text-brand-dark sm:text-5xl">
              A Kenyan enterprise with a practical purpose.
            </h2>
            <div className="mt-7 border-l-2 border-sun pl-5">
              <p className="font-display text-xl leading-relaxed text-brand">
                “Empowering communities. Building prosperity.”
              </p>
              <p className="mt-2 text-[0.625rem] font-bold uppercase tracking-[0.16em] text-ink-muted">
                The GIWESA promise
              </p>
            </div>
          </div>

          <div className="lg:col-span-7">
            <p className="font-display text-[1.55rem] leading-[1.5] text-brand-dark sm:text-[1.8rem]">
              GIWESA Solutions is a forward-looking Kenyan enterprise dedicated to empowering
              individuals, businesses, institutions and communities.
            </p>
            <div className="mt-6 space-y-5 text-[1.0625rem] leading-8 text-ink-muted">
              <p>
                We bridge the gap between opportunity and access through financial inclusion,
                enterprise development, education, welfare and consultancy. Our work brings savings,
                credit, protection and practical support closer to the people who need them.
              </p>
              <p>
                Our head office is in Homa Bay, and our approach is rooted in the realities of local
                households and enterprises: irregular income, competing responsibilities and the
                need for terms that are understood before a decision is made.
              </p>
            </div>

            <div className="mt-9 grid gap-5 border-t border-line pt-7 sm:grid-cols-2">
              <div className="flex gap-3">
                <Building2 className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
                <div>
                  <p className="text-sm font-bold text-brand-dark">
                    One organisation, connected support
                  </p>
                  <p className="mt-1.5 text-sm leading-6 text-ink-muted">
                    Savings, micro-loans, welfare and community partnerships sit within one
                    organisation.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <HeartHandshake
                  className="mt-0.5 size-5 shrink-0 text-leaf-dark"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-bold text-brand-dark">Human before transactional</p>
                  <p className="mt-1.5 text-sm leading-6 text-ink-muted">
                    Every inquiry starts a conversation, not an automated sales process.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-brand-dark text-inverse">
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-24 size-[30rem] rounded-full border border-white/15"
        />
        <div className="container-page section-space relative grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="eyebrow eyebrow-inverse">Our mission</p>
            <h2 className="mt-5 max-w-xl font-display text-[2.15rem] leading-[1.2] text-white sm:text-[2.65rem]">
              To empower communities through financial inclusion, education, welfare programmes, and
              strategic partnerships for sustainable socio-economic growth.
            </h2>
          </div>
          <div className="border-t border-white/20 pt-8 lg:border-l lg:border-t-0 lg:pl-16 lg:pt-0">
            <p className="eyebrow eyebrow-inverse">Our vision</p>
            <p className="mt-5 max-w-lg text-[1.0625rem] leading-8 text-inverse-muted">
              To become a leading African organisation delivering innovative financial, educational,
              enterprise, and community development solutions.
            </p>
            <p className="mt-8 font-display text-2xl italic text-[#e9d8b2]">
              Prosperity built together.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-muted">
        <div className="container-page section-space">
          <SectionHeading
            eyebrow="What guides us"
            title="Values that show up in the small things."
            description="A financial relationship is built through the way questions are answered, terms are explained and problems are handled."
          />
          <div className="mt-12 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-5">
            {values.map((value, index) => (
              <div key={value.name} className="border-t border-line-strong pt-5">
                <p className="text-[0.625rem] font-bold tracking-[0.16em] text-leaf-dark">
                  0{index + 1}
                </p>
                <h3 className="mt-3 font-display text-2xl text-brand-dark">{value.name}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-muted">{value.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-canvas">
        <div className="container-page section-space grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="eyebrow">Our approach</p>
            <h2 className="mt-5 font-display text-[2.5rem] leading-[1.05] text-brand-dark sm:text-5xl">
              Start with listening.
            </h2>
            <p className="mt-5 max-w-md text-[1.0625rem] leading-8 text-ink-muted">
              Good financial decisions are not made in a vacuum. We try to understand the goal,
              explain the options and make room for questions.
            </p>
            <Link
              href="/contact"
              className="group mt-7 inline-flex items-center gap-2 text-sm font-bold text-brand"
            >
              <span className="link-underline">Start a conversation</span>
              <ArrowUpRight
                className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </div>
          <div className="lg:col-span-7">
            <ol className="divide-y divide-line border-y border-line">
              {[
                {
                  title: "Understand the whole situation",
                  body: "Your income, responsibilities and timing matter more than a generic product category.",
                },
                {
                  title: "Make the terms visible",
                  body: "Fees, limits, maturity periods and repayment expectations should be clear before you commit.",
                },
                {
                  title: "Stay available",
                  body: "A plan is not finished at sign-up. Questions, changes and repayments all need a human point of contact.",
                },
              ].map((item, index) => (
                <li key={item.title} className="grid grid-cols-[2.5rem_1fr] gap-4 py-7">
                  <span className="font-display text-2xl text-line-strong">0{index + 1}</span>
                  <div>
                    <h3 className="font-sans text-lg font-bold tracking-normal text-brand-dark">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-7 text-ink-muted">{item.body}</p>
                  </div>
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
