import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({
  items,
  tone = "light",
}: {
  items: Crumb[];
  tone?: "light" | "dark";
}) {
  return (
    <nav aria-label="Breadcrumb">
      <ol
        className={cn(
          "flex flex-wrap items-center gap-1.5 text-[0.6875rem] font-semibold",
          tone === "dark" ? "text-inverse-muted" : "text-ink-muted",
        )}
      >
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {index > 0 ? (
              <ChevronRight className="size-3 text-line-strong" aria-hidden="true" />
            ) : null}
            {item.href ? (
              <Link
                href={item.href}
                className={cn(
                  "transition-colors hover:text-brand",
                  tone === "dark" && "hover:text-white",
                )}
              >
                {item.label}
              </Link>
            ) : (
              <span
                aria-current="page"
                className={tone === "dark" ? "text-white" : "text-brand-dark"}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  breadcrumbs?: Crumb[];
  aside?: ReactNode;
  children?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumbs,
  aside,
  children,
}: PageHeaderProps) {
  return (
    <section className="paper-glow relative overflow-hidden border-b border-line">
      <div
        aria-hidden="true"
        className="paper-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:linear-gradient(to_right,black,transparent_78%)]"
      />
      <div className="container-page relative py-10 sm:py-14 lg:py-20">
        {breadcrumbs ? <Breadcrumbs items={breadcrumbs} /> : null}
        <div
          className={cn(
            "grid gap-10",
            aside ? "mt-8 lg:grid-cols-[1.1fr_0.7fr] lg:items-end lg:gap-16" : "mt-8",
          )}
        >
          <div className="max-w-3xl">
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="mt-5 font-display text-[clamp(2.75rem,6vw,4.75rem)] leading-[0.99] tracking-[-0.035em] text-brand-dark">
              {title}
            </h1>
            {description ? (
              <p className="mt-6 max-w-2xl text-[1.0625rem] leading-8 text-ink-muted sm:text-lg">
                {description}
              </p>
            ) : null}
            {children ? <div className="mt-8">{children}</div> : null}
          </div>
          {aside ? <div>{aside}</div> : null}
        </div>
      </div>
    </section>
  );
}
