import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Inbox } from "lucide-react";

import { cn } from "@/lib/utils";

export function AdminPageHeader({
  title,
  description,
  action,
  backHref,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  backHref?: string;
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        {backHref ? (
          <Link
            href={backHref}
            className="mb-3 inline-flex items-center gap-1.5 text-[0.6875rem] font-bold text-ink-muted transition-colors hover:text-brand"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Back
          </Link>
        ) : null}
        <h1 className="font-display text-[2rem] leading-tight text-brand-dark sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

const STATUS_TONES: Record<string, string> = {
  NEW: "border-[#b8d1e6] bg-[#eaf2f9] text-[#124d78]",
  CONTACTED: "border-[#ead2a3] bg-[#fcf3e0] text-[#7a5300]",
  CONFIRMED: "border-[#b9d8c3] bg-[#e9f5ee] text-[#2e6b45]",
  COMPLETED: "border-[#c6d2dd] bg-[#eef2f5] text-[#3c5568]",
  CANCELLED: "border-[#e8c1bc] bg-[#fbedeb] text-[#8c2c23]",
  RESOLVED: "border-[#b9d8c3] bg-[#e9f5ee] text-[#2e6b45]",
  ARCHIVED: "border-[#dadde2] bg-[#f3f4f5] text-[#5c646b]",
  DRAFT: "border-[#ead2a3] bg-[#fcf3e0] text-[#7a5300]",
  PUBLISHED: "border-[#b9d8c3] bg-[#e9f5ee] text-[#2e6b45]",
};

const STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  RESOLVED: "Resolved",
  ARCHIVED: "Archived",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  DRAFT: "Draft",
  PUBLISHED: "Published",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.625rem] font-bold uppercase tracking-[0.06em]",
        STATUS_TONES[status] ?? "border-admin-line bg-[#f5f6f4] text-ink-muted",
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function AdminEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-brand-light text-brand">
        <Inbox className="size-5" aria-hidden="true" />
      </span>
      <h2 className="mt-4 font-display text-2xl text-brand-dark">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-ink-muted">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function AdminPagination({
  page,
  pages,
  basePath,
  query,
}: {
  page: number;
  pages: number;
  basePath: string;
  query?: Record<string, string | undefined>;
}) {
  if (pages <= 1) return null;

  function href(target: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value) params.set(key, value);
    }
    if (target > 1) params.set("page", String(target));
    const suffix = params.toString();
    return suffix ? `${basePath}?${suffix}` : basePath;
  }

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between border-t border-admin-line px-4 py-3 text-xs"
    >
      {page > 1 ? (
        <Link
          href={href(page - 1)}
          className="inline-flex items-center gap-1.5 font-bold text-brand hover:text-brand-dark"
        >
          <ChevronLeft className="size-3.5" aria-hidden="true" />
          Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="numeric text-ink-muted">
        Page {page} of {pages}
      </span>
      {page < pages ? (
        <Link
          href={href(page + 1)}
          className="inline-flex items-center gap-1.5 font-bold text-brand hover:text-brand-dark"
        >
          Next
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

export function AdminNotice({
  tone = "success",
  children,
}: {
  tone?: "success" | "error" | "info";
  children: ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "mb-5 rounded-lg border px-4 py-3 text-xs font-semibold leading-5",
        tone === "success" && "border-[#b9d8c3] bg-[#eef8f1] text-[#2e6b45]",
        tone === "error" && "border-[#e8c1bc] bg-danger-soft text-danger",
        tone === "info" && "border-[#b8d1e6] bg-[#edf5fb] text-[#124d78]",
      )}
    >
      {children}
    </div>
  );
}
