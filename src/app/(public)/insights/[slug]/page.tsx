import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Clock3 } from "lucide-react";

import { BLOG_CATEGORY_LABELS, BLOG_FALLBACK_COVER } from "@/config/site";
import {
  getLatestPosts,
  getPublishedPost,
  getPublishedSlugs,
  postReadingTime,
} from "@/domains/blog/service";
import { getSiteSettings } from "@/domains/site-settings/service";
import { formatLongDate } from "@/lib/dates";
import { absoluteUrl, articleJsonLd, breadcrumbJsonLd, JsonLd } from "@/lib/seo";
import { initials } from "@/lib/utils";
import { ArticleBody } from "@/components/public/article-body";
import { ArticleCard } from "@/components/public/article-card";
import { Breadcrumbs } from "@/components/public/page-header";
import { ShareButton } from "@/components/public/share-button";
import { ButtonLink } from "@/components/ui/button";

export async function generateStaticParams() {
  const slugs = await getPublishedSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) {
    return { title: "Article not found", robots: { index: false, follow: false } };
  }
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt;
  const cover = post.coverImage || BLOG_FALLBACK_COVER;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/insights/${post.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/insights/${post.slug}`,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [post.authorName],
      images: [
        {
          url: cover,
          width: 1200,
          height: 800,
          alt: post.coverAlt || post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [cover],
    },
  };
}

export default async function InsightPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, settings, latest] = await Promise.all([
    getPublishedPost(slug),
    getSiteSettings(),
    getLatestPosts(4),
  ]);

  if (!post) notFound();

  const category = BLOG_CATEGORY_LABELS[post.category] ?? "Insights";
  const published = post.publishedAt ?? post.updatedAt;
  const readingTime = postReadingTime(post.content);
  const cover = post.coverImage || BLOG_FALLBACK_COVER;
  const related = latest.filter((item) => item.slug !== post.slug).slice(0, 3);

  return (
    <>
      <JsonLd
        data={[
          articleJsonLd(post),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Insights", path: "/insights" },
            { name: post.title, path: `/insights/${post.slug}` },
          ]),
        ]}
      />
      <article>
        <header className="paper-glow border-b border-line">
          <div className="container-page pb-10 pt-8 sm:pb-14 sm:pt-10">
            <Breadcrumbs
              items={[
                { label: "Home", href: "/" },
                { label: "Insights", href: "/insights" },
                { label: category },
              ]}
            />
            <div className="mx-auto mt-8 max-w-4xl text-center">
              <p className="flex flex-wrap items-center justify-center gap-2 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-leaf-dark">
                <span>{category}</span>
                <span className="size-0.5 rounded-full bg-line-strong" aria-hidden="true" />
                <time dateTime={published.toISOString()}>{formatLongDate(published)}</time>
              </p>
              <h1 className="mt-5 font-display text-[clamp(2.5rem,5.6vw,4.5rem)] leading-[1.02] tracking-[-0.035em] text-brand-dark">
                {post.title}
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-[1.0625rem] leading-8 text-ink-muted">
                {post.excerpt}
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-[0.6875rem] font-semibold text-ink-muted">
                <span className="inline-flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-full bg-brand-light font-sans text-[0.5625rem] font-bold text-brand">
                    {initials(post.authorName)}
                  </span>
                  {post.authorName}
                </span>
                <span className="size-0.5 rounded-full bg-line-strong" aria-hidden="true" />
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="size-3.5 text-leaf-dark" aria-hidden="true" />
                  {readingTime} min read
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="container-page">
          <div className="relative mx-auto mt-8 aspect-[16/9] max-w-5xl overflow-hidden rounded-2xl border border-line bg-muted sm:mt-10">
            <Image
              src={cover}
              alt={post.coverAlt || ""}
              fill
              priority
              sizes="(min-width: 1024px) 1024px, 100vw"
              className="object-cover"
            />
          </div>
        </div>

        <div className="container-page grid gap-10 py-12 lg:grid-cols-12 lg:gap-12 lg:py-16">
          <aside className="hidden lg:col-span-2 lg:block">
            <div className="sticky top-28">
              <ShareButton url={absoluteUrl(`/insights/${post.slug}`)} title={post.title} />
            </div>
          </aside>

          <div className="lg:col-span-7">
            <ArticleBody content={post.content} />

            <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-line pt-6 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-brand-light text-[0.625rem] font-bold text-brand">
                  {initials(post.authorName)}
                </span>
                <div>
                  <p className="text-xs font-bold text-brand-dark">{post.authorName}</p>
                  <p className="text-[0.6875rem] text-ink-muted">GIWESA Insights</p>
                </div>
              </div>
              <div className="lg:hidden">
                <ShareButton url={absoluteUrl(`/insights/${post.slug}`)} title={post.title} />
              </div>
            </div>
          </div>

          <aside className="lg:col-span-3">
            <div className="sticky top-28 rounded-2xl border border-line bg-paper p-5">
              <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-leaf-dark">
                A question after reading?
              </p>
              <p className="mt-3 font-display text-2xl leading-snug text-brand-dark">
                Talk it through with the GIWESA team.
              </p>
              <p className="mt-2 text-xs leading-5 text-ink-muted">
                Ask about savings, loans, welfare or a partnership.
              </p>
              <ButtonLink href="/contact" size="sm" className="mt-5 w-full justify-between">
                Send an inquiry
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </ButtonLink>
              <p className="mt-4 border-t border-line pt-4 text-[0.6875rem] leading-5 text-ink-muted">
                {settings.address}
              </p>
            </div>
          </aside>
        </div>
      </article>

      {related.length > 0 ? (
        <section className="border-t border-line bg-paper">
          <div className="container-page section-space">
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="eyebrow">Keep reading</p>
                <h2 className="mt-4 font-display text-3xl text-brand-dark sm:text-4xl">
                  More from insights.
                </h2>
              </div>
              <Link
                href="/insights"
                className="hidden items-center gap-2 text-sm font-bold text-brand sm:inline-flex"
              >
                <span className="link-underline">All insights</span>
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-8 grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <ArticleCard key={item.id} post={item} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
