"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl py-16">
      <div className="admin-card p-7">
        <span className="inline-flex size-11 items-center justify-center rounded-full bg-danger-soft text-danger">
          <AlertTriangle className="size-5" aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-display text-3xl text-brand-dark">This screen could not load.</h1>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          The action may not have completed. Try again. If the problem continues, contact another
          administrator.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-full bg-brand px-4 text-xs font-bold text-white hover:bg-brand-dark"
        >
          <RefreshCw className="size-3.5" aria-hidden="true" />
          Try again
        </button>
      </div>
    </div>
  );
}
