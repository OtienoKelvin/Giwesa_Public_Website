"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function PublicError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="paper-glow">
      <div className="container-page flex min-h-[60vh] max-w-2xl flex-col justify-center py-20">
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-danger-soft text-danger">
          <AlertTriangle className="size-5" aria-hidden="true" />
        </span>
        <p className="eyebrow mt-6">Something went wrong</p>
        <h1 className="mt-4 font-display text-5xl leading-[1.05] text-brand-dark">
          We couldn&apos;t load this page.
        </h1>
        <p className="mt-4 max-w-md text-[1.0625rem] leading-8 text-ink-muted">
          Please try again. If the problem continues, you can contact the GIWESA team or return to
          the homepage.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand px-5 text-sm font-bold text-white hover:bg-brand-dark"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-line-strong px-5 text-sm font-bold text-ink hover:border-brand"
          >
            Return home
          </Link>
          <Link
            href="/contact"
            className="inline-flex min-h-11 items-center justify-center px-5 text-sm font-bold text-brand hover:text-brand-dark"
          >
            Contact GIWESA
          </Link>
        </div>
      </div>
    </section>
  );
}
