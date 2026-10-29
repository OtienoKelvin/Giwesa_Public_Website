import type { Metadata } from "next";

import { getLatestPosts } from "@/domains/blog/service";
import { getPublicProducts } from "@/domains/products/service";
import { getSiteSettings } from "@/domains/site-settings/service";
import { SectionHeading } from "@/components/public/section-heading";
import { SolutionsList } from "@/components/public/home/solutions-list";
import { ButtonLink } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

import { AudienceStrip, WhyGiwesa } from "@/components/public/home/why";
import { CommunitySection } from "@/components/public/home/community";
import { FinalCta } from "@/components/public/home/final-cta";
import { HomeHero } from "@/components/public/home/hero";
import { HowItWorks } from "@/components/public/home/process";
import { LatestInsights } from "@/components/public/home/latest-insights";
import { WelfareFeature } from "@/components/public/home/welfare-feature";

export const metadata: Metadata = {
  title: {
    absolute: "GIWESA Solutions | Savings, loans and welfare protection in Kenya",
  },
  description:
    "GIWESA Solutions is a Kenyan microfinance organisation offering savings, savings-linked micro-loans and welfare protection, with practical guidance at every step.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "GIWESA Solutions | Financial confidence, built with community",
    description:
      "Savings, micro-loans and welfare protection for individuals, families and small businesses in Kenya.",
    url: "/",
  },
};

export default async function HomePage() {
  const [settings, products, posts] = await Promise.all([
    getSiteSettings(),
    getPublicProducts(),
    getLatestPosts(3),
  ]);

  return (
    <>
      <HomeHero settings={settings} />
      <AudienceStrip />

      <section className="bg-canvas">
        <div className="container-page section-space">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-4">
              <SectionHeading
                eyebrow="What we do"
                title="Three ways to build forward."
                description="A savings-led approach, protection for the unexpected, and community partnerships that widen access."
              />
              <ButtonLink href="/solutions" variant="secondary" className="mt-7">
                Explore all solutions
                <ArrowRight className="size-4" aria-hidden="true" />
              </ButtonLink>
            </div>
            <div className="lg:col-span-8">
              {products.length > 0 ? (
                <SolutionsList products={products} />
              ) : (
                <div className="rounded-2xl border border-dashed border-line-strong bg-paper p-8">
                  <p className="font-display text-2xl text-brand-dark">
                    Our solutions are being updated.
                  </p>
                  <p className="mt-2 text-sm leading-6 text-ink-muted">
                    Please contact the team for current information.
                  </p>
                  <ButtonLink href="/contact" variant="secondary" size="sm" className="mt-4">
                    Contact GIWESA
                  </ButtonLink>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <WhyGiwesa />
      <HowItWorks settings={settings} />
      <WelfareFeature />
      <CommunitySection />
      <LatestInsights posts={posts} />
      <FinalCta settings={settings} />
    </>
  );
}
