import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, ArrowRight, Filter } from "lucide-react";

import { BLOG_CATEGORIES } from "@/config/site";
import { getPublishedPosts } from "@/domains/blog/service";
import { ArticleCard } from "@/components/public/article-card";
import { PageHeader } from "@/components/public/page-header";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Insights & financial education",
  description:
    "Practical articles from GIWESA Solutions on saving, borrowing, welfare protection and financial wellbeing in Kenya.",
  alternates: { canonical: "/insights" },
  openGraph: {
    title: "Insights & financial education | GIWESA Solutions",
    description:
      "Plain-language articles on saving, borrowing and family protection from GIWESA Solutions.",
    url: "/insights",
  },
};

type SearchParams = { category?: string; page?: string };

function parseCategory(value: string | undefined) {
  return BLOG_CATEGORIES.some((category) => category.value === value) ? value : undefined;
}

function parsePage(value: string | undefined) {
  const page = Number(value ?? "1");
  return Number.isFinite(page) && page >= 1 ? Math.trunc(page) : 1;
}

function buildHref({ category, page }: { category?: string; page?: number }) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (page && page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/insights?${query}` : "/insights";
}

export default function InsightsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <>
      <PageHeader
        eyebrow="Insights"
        title="Practical reading for everyday financial decisions."
        description="Clear, grounded articles on saving, borrowing, family protection and financial wellbeing. No jargon, no hype."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Insights" }]}
      />

      <Suspense fallback={<InsightsSkeleton />}>
        <InsightsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function InsightsContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const category = parseCategory(
    Array.isArray(params.category) ? params.category[0] : params.category,
  );
  const page = parsePage(Array.isArray(params.page) ? params.page[0] : params.page);
  const { posts, total, pages } = await getPublishedPosts({ category: category as never, page });

  return (
    <section className="bg-canvas">
      <div className="container-page pb-16 pt-10 sm:pb-20 lg:pb-24">
        <div className="flex flex-col gap-6 border-b border-line pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-ink-muted">
              <Filter className="size-3.5 text-leaf-dark" aria-hidden="true" />
              {total} {total === 1 ? "article" : "articles"}
            </p>
          </div>
          <nav aria-label="Filter insights by topic" className="flex flex-wrap gap-2">
            <Link
              href={buildHref({})}
              aria-current={!category ? "page" : undefined}
              className={`inline-flex min-h-9 items-center rounded-full border px-3.5 text-xs font-bold transition-colors ${
                !category
                  ? "border-brand bg-brand text-white"
                  : "border-line-strong bg-paper text-ink-muted hover:border-brand hover:text-brand"
              }`}
            >
              All topics
            </Link>
            {BLOG_CATEGORIES.map((item) => (
              <Link
                key={item.value}
                href={buildHref({ category: item.value })}
                aria-current={category === item.value ? "page" : undefined}
                className={`inline-flex min-h-9 items-center rounded-full border px-3.5 text-xs font-bold transition-colors ${
                  category === item.value
                    ? "border-brand bg-brand text-white"
                    : "border-line-strong bg-paper text-ink-muted hover:border-brand hover:text-brand"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {posts.length === 0 ? (
          <div className="mx-auto mt-16 max-w-xl text-center">
            <p className="eyebrow justify-center">Nothing here yet</p>
            <h2 className="mt-4 font-display text-4xl text-brand-dark">
              No articles in this topic.
            </h2>
            <p className="mt-3 text-sm leading-7 text-ink-muted">
              Try another topic, or speak with the team if you have a question we have not written
              about yet.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/insights" variant="secondary">
                View all insights
              </ButtonLink>
              <ButtonLink href="/contact" variant="primary">
                Talk to GIWESA
              </ButtonLink>
            </div>
          </div>
        ) : (
          <div className="mt-10 grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <ArticleCard key={post.id} post={post} priority={index < 3} />
            ))}
          </div>
        )}

        {pages > 1 ? (
          <nav
            aria-label="Insight pagination"
            className="mt-14 flex items-center justify-between border-t border-line pt-6"
          >
            {page > 1 ? (
              <Link
                href={buildHref({ category, page: page - 1 })}
                className="inline-flex items-center gap-2 text-sm font-bold text-brand"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Newer articles
              </Link>
            ) : (
              <span />
            )}
            <p className="text-xs font-semibold text-ink-muted">
              Page {page} of {pages}
            </p>
            {page < pages ? (
              <Link
                href={buildHref({ category, page: page + 1 })}
                className="inline-flex items-center gap-2 text-sm font-bold text-brand"
              >
                Older articles
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </div>
    </section>
  );
}

function InsightsSkeleton() {
  return (
    <section className="bg-canvas" aria-busy="true" aria-label="Loading insights">
      <div className="container-page pb-16 pt-10 sm:pb-20 lg:pb-24">
        <div className="flex flex-col gap-6 border-b border-line pb-6 md:flex-row md:items-center md:justify-between">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-9 w-24 animate-pulse rounded-full bg-muted" />
            ))}
          </div>
        </div>
        <div className="mt-10 grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item}>
              <div className="aspect-[3/2] animate-pulse rounded-2xl bg-muted" />
              <div className="mt-5 h-3 w-32 animate-pulse rounded bg-muted" />
              <div className="mt-3 h-7 w-5/6 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-7 w-2/3 animate-pulse rounded bg-muted" />
              <div className="mt-4 h-4 w-full animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
