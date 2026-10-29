import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  MessageCircle,
  Phone,
  Plus,
  ShieldCheck,
  Sparkles,
  Sprout,
  Users,
} from "lucide-react";

import { PRODUCT_FAQS, PRODUCT_TERMS, SITE } from "@/config/site";
import {
  getPublicProduct,
  getPublicProducts,
  productDetailLines,
} from "@/domains/products/service";
import { getSiteSettings } from "@/domains/site-settings/service";
import { JsonLd, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { phoneHref } from "@/lib/utils";
import { PageHeader } from "@/components/public/page-header";
import { ProductTerms } from "@/components/public/product-terms";
import { ButtonLink } from "@/components/ui/button";

const icons = {
  sprout: Sprout,
  shield: ShieldCheck,
  people: Users,
  spark: Sparkles,
} as const;

export async function generateStaticParams() {
  const products = await getPublicProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicProduct(slug);
  if (!product) {
    return { title: "Solution not found", robots: { index: false, follow: false } };
  }
  const title = product.seoTitle || `${product.name} | GIWESA Solutions`;
  const description = product.seoDescription || product.summary;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/solutions/${product.slug}` },
    openGraph: {
      title,
      description,
      url: `/solutions/${product.slug}`,
      images: [
        {
          url: "/og/giwesa-og.png",
          width: 1200,
          height: 630,
          alt: "GIWESA Solutions",
        },
      ],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, products, settings] = await Promise.all([
    getPublicProduct(slug),
    getPublicProducts(),
    getSiteSettings(),
  ]);

  if (!product) notFound();

  const Icon = icons[product.iconKey as keyof typeof icons] ?? Sparkles;
  const { benefits, steps } = productDetailLines(product);
  const terms = PRODUCT_TERMS[product.slug] ?? [];
  const faqs = PRODUCT_FAQS[product.slug] ?? [];
  const related = products.filter((item) => item.slug !== product.slug).slice(0, 2);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Solutions", path: "/solutions" },
            { name: product.name, path: `/solutions/${product.slug}` },
          ]),
          ...(faqs.length > 0 ? [faqJsonLd(faqs)] : []),
        ]}
      />
      <PageHeader
        eyebrow={product.eyebrow}
        title={product.name}
        description={product.tagline}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Solutions", href: "/solutions" },
          { label: product.name },
        ]}
        aside={
          <div className="rounded-2xl bg-brand-dark p-6 text-inverse shadow-[var(--shadow-lift-value)] sm:p-7">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-[#e7d6ad]">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <p className="text-[0.625rem] font-bold uppercase tracking-[0.16em] text-[#e7d6ad]">
                Talk to a person
              </p>
            </div>
            <p className="mt-4 font-display text-2xl leading-snug text-white">
              Ask about eligibility and current terms before you decide.
            </p>
            <p className="mt-3 text-sm leading-6 text-inverse-muted">
              Our team can explain how this solution works and whether it fits your situation.
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <ButtonLink href="/book" variant="inverse" size="sm" className="justify-between">
                Book a consultation
                <ArrowRight className="size-4" aria-hidden="true" />
              </ButtonLink>
              <a
                href={phoneHref(settings.phone)}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-white/25 px-4 text-xs font-bold text-white transition-colors hover:bg-white/10"
              >
                <Phone className="size-3.5" aria-hidden="true" />
                <span className="numeric">{settings.phone}</span>
              </a>
            </div>
          </div>
        }
      />

      <section className="bg-canvas">
        <div className="container-page section-space grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-8">
            <section aria-labelledby="overview-heading">
              <p className="eyebrow">Overview</p>
              <h2
                id="overview-heading"
                className="mt-4 font-display text-3xl leading-tight text-brand-dark sm:text-4xl"
              >
                {product.summary}
              </h2>
              <p className="mt-5 whitespace-pre-line text-[1.0625rem] leading-8 text-ink-muted">
                {product.overview}
              </p>
            </section>

            <section aria-labelledby="who-heading" className="mt-12 border-t border-line pt-8">
              <p className="eyebrow">Who it is for</p>
              <h2 id="who-heading" className="mt-4 font-display text-3xl text-brand-dark">
                Made for a real starting point.
              </h2>
              <p className="mt-4 whitespace-pre-line text-[1rem] leading-8 text-ink-muted">
                {product.whoFor}
              </p>
            </section>

            {steps.length > 0 ? (
              <section aria-labelledby="how-heading" className="mt-12 border-t border-line pt-8">
                <p className="eyebrow">How it works</p>
                <h2
                  id="how-heading"
                  className="mt-4 font-display text-3xl text-brand-dark sm:text-4xl"
                >
                  The steps, in plain language.
                </h2>
                <ol className="mt-7">
                  {steps.map((step, index) => (
                    <li
                      key={step}
                      className="grid grid-cols-[2.5rem_1fr] gap-4 border-t border-line py-5 last:border-b sm:grid-cols-[3rem_1fr] sm:gap-6"
                    >
                      <span className="font-display text-2xl text-line-strong">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <p className="text-[0.9375rem] leading-7 text-ink">{step}</p>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            {benefits.length > 0 ? (
              <section
                aria-labelledby="benefits-heading"
                className="mt-12 rounded-2xl bg-leaf-light p-6 sm:p-8"
              >
                <p className="eyebrow">What you get</p>
                <h2 id="benefits-heading" className="mt-4 font-display text-3xl text-brand-dark">
                  The practical benefits.
                </h2>
                <ul className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  {benefits.map((benefit) => (
                    <li key={benefit} className="flex gap-3 text-sm leading-6 text-ink">
                      <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-white text-leaf-dark">
                        <Check className="size-3.5" aria-hidden="true" />
                      </span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {product.notes ? (
              <aside className="mt-10 border-l-2 border-sun bg-sun-soft/60 px-5 py-4">
                <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-[#7d5300]">
                  Good to know
                </p>
                <p className="mt-2 text-sm leading-6 text-ink-muted">{product.notes}</p>
              </aside>
            ) : null}
          </div>

          <aside className="lg:col-span-4">
            <div className="space-y-5 lg:sticky lg:top-28">
              <div className="rounded-2xl border border-line bg-paper p-5">
                <p className="text-[0.625rem] font-bold uppercase tracking-[0.15em] text-leaf-dark">
                  At the office
                </p>
                <p className="mt-3 text-sm leading-6 text-ink-muted">{settings.address}</p>
                <p className="mt-4 border-t border-line pt-4 text-[0.6875rem] font-semibold text-ink-muted">
                  Published terms can change. Confirm the current details with the GIWESA team
                  before making a commitment.
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-white p-5">
                <p className="text-[0.625rem] font-bold uppercase tracking-[0.15em] text-brand">
                  Prefer an inquiry?
                </p>
                <p className="mt-2 text-sm leading-6 text-ink-muted">
                  Send a question and our team will respond.
                </p>
                <Link
                  href="/contact"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand"
                >
                  <span className="link-underline">Send an inquiry</span>
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {terms.length > 0 ? (
        <section className="border-y border-line bg-muted">
          <div className="container-page section-space">
            <div className="mb-9 max-w-2xl">
              <p className="eyebrow">Published terms</p>
              <p className="mt-4 text-sm leading-7 text-ink-muted">
                These are the details GIWESA publishes for this solution. Current terms are
                confirmed with you before you commit.
              </p>
            </div>
            <ProductTerms terms={terms} />
          </div>
        </section>
      ) : null}

      {faqs.length > 0 ? (
        <section className="bg-canvas" aria-labelledby="faq-heading">
          <div className="container-page section-space grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <p className="eyebrow">Questions</p>
              <h2
                id="faq-heading"
                className="mt-5 font-display text-4xl text-brand-dark sm:text-5xl"
              >
                Straight answers.
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-7 text-ink-muted">
                If your question is not here, the team can answer it directly.
              </p>
              <Link
                href="/contact"
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-brand"
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                <span className="link-underline">Ask GIWESA</span>
              </Link>
            </div>
            <div className="lg:col-span-8">
              <div className="border-t border-line">
                {faqs.map((faq) => (
                  <details key={faq.question} className="group border-b border-line">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-5 py-5 text-left">
                      <span className="font-sans text-[0.9375rem] font-bold leading-6 text-brand-dark">
                        {faq.question}
                      </span>
                      <Plus
                        className="mt-0.5 size-4 shrink-0 text-brand transition-transform duration-200 group-open:rotate-45"
                        aria-hidden="true"
                      />
                    </summary>
                    <p className="max-w-2xl pb-5 pr-8 text-sm leading-7 text-ink-muted">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="border-t border-line bg-paper">
        <div className="container-page section-space">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">Keep exploring</p>
              <h2 className="mt-4 font-display text-3xl text-brand-dark sm:text-4xl">
                Other ways GIWESA can help.
              </h2>
            </div>
            <Link
              href="/solutions"
              className="inline-flex items-center gap-2 text-sm font-bold text-brand"
            >
              <span className="link-underline">All solutions</span>
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {related.map((item) => {
              const RelatedIcon = icons[item.iconKey as keyof typeof icons] ?? Sparkles;
              return (
                <Link
                  key={item.id}
                  href={`/solutions/${item.slug}`}
                  className="group flex items-center justify-between gap-5 rounded-2xl border border-line bg-white p-5 transition-colors hover:border-brand"
                >
                  <span className="flex items-center gap-4">
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand">
                      <RelatedIcon className="size-5" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block font-display text-xl text-brand-dark">
                        {item.name}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-ink-muted">
                        {item.eyebrow}
                      </span>
                    </span>
                  </span>
                  <ArrowUpRight
                    className="size-4 shrink-0 text-brand transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              );
            })}
          </div>
          <p className="mt-8 text-[0.6875rem] leading-5 text-ink-muted">
            {SITE.name} · {settings.address}
          </p>
        </div>
      </section>
    </>
  );
}
