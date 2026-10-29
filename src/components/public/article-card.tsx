import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { BLOG_CATEGORY_LABELS, BLOG_FALLBACK_COVER } from "@/config/site";
import type { PublicPostCard } from "@/domains/blog/service";
import { formatShortDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

type ArticleCardProps = {
  post: PublicPostCard;
  variant?: "feature" | "compact" | "grid";
  className?: string;
  priority?: boolean;
};

export function ArticleCard({
  post,
  variant = "grid",
  className,
  priority = false,
}: ArticleCardProps) {
  const image = post.coverImage || BLOG_FALLBACK_COVER;
  const category = BLOG_CATEGORY_LABELS[post.category] ?? "Insights";

  if (variant === "compact") {
    return (
      <Link
        href={`/insights/${post.slug}`}
        className={cn("group grid gap-4 sm:grid-cols-[9rem_1fr] sm:items-start", className)}
      >
        <span className="relative block aspect-[4/3] overflow-hidden rounded-xl bg-muted">
          <Image
            src={image}
            alt={post.coverAlt || ""}
            fill
            sizes="(min-width: 1024px) 144px, 40vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.035]"
          />
        </span>
        <span className="block min-w-0">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.625rem] font-bold uppercase tracking-[0.13em] text-leaf-dark">
            {category}
            <span className="size-0.5 rounded-full bg-line-strong" aria-hidden="true" />
            <time dateTime={post.publishedAt?.toISOString()}>
              {post.publishedAt ? formatShortDate(post.publishedAt) : ""}
            </time>
          </span>
          <span className="mt-2 block font-display text-[1.35rem] leading-[1.22] text-brand-dark transition-colors group-hover:text-brand">
            {post.title}
          </span>
          <span className="mt-2 line-clamp-2 block text-sm leading-6 text-ink-muted">
            {post.excerpt}
          </span>
        </span>
      </Link>
    );
  }

  return (
    <Link href={`/insights/${post.slug}`} className={cn("group block", className)}>
      <span className="relative block aspect-[3/2] overflow-hidden rounded-2xl bg-muted">
        <Image
          src={image}
          alt={post.coverAlt || ""}
          fill
          sizes={
            variant === "feature"
              ? "(min-width: 1024px) 62vw, 100vw"
              : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          }
          priority={priority}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.025]"
        />
        <span className="absolute left-4 top-4 rounded-full bg-canvas/95 px-3 py-1.5 text-[0.625rem] font-bold uppercase tracking-[0.13em] text-brand-dark shadow-sm backdrop-blur">
          {category}
        </span>
      </span>
      <span className="mt-5 flex items-center gap-2 text-[0.6875rem] font-semibold text-ink-muted">
        <time dateTime={post.publishedAt?.toISOString()}>
          {post.publishedAt ? formatShortDate(post.publishedAt) : ""}
        </time>
        <span className="size-0.5 rounded-full bg-line-strong" aria-hidden="true" />
        <span>{post.authorName}</span>
      </span>
      <span
        className={cn(
          "mt-2.5 block font-display leading-[1.18] text-brand-dark transition-colors group-hover:text-brand",
          variant === "feature" ? "text-[2rem] sm:text-[2.6rem]" : "text-[1.55rem]",
        )}
      >
        {post.title}
      </span>
      <span
        className={cn(
          "mt-3 block text-sm leading-6 text-ink-muted",
          variant === "feature" ? "max-w-xl text-[0.9375rem]" : "line-clamp-2",
        )}
      >
        {post.excerpt}
      </span>
      <span className="mt-4 inline-flex items-center gap-1.5 text-[0.75rem] font-bold text-brand">
        Read the article
        <ArrowUpRight
          aria-hidden="true"
          className="size-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        />
      </span>
    </Link>
  );
}
