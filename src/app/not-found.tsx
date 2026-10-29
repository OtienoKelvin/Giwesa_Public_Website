import Link from "next/link";

import { Logo } from "@/components/public/logo";

export default function RootNotFound() {
  return (
    <main className="paper-glow flex min-h-dvh items-center justify-center px-5 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-paper p-8 text-center shadow-[var(--shadow-soft-value)]">
        <Logo className="mx-auto size-20" />
        <p className="eyebrow mt-6 justify-center">404</p>
        <h1 className="mt-4 font-display text-4xl text-brand-dark">Page not found.</h1>
        <p className="mt-3 text-sm leading-7 text-ink-muted">
          The page you requested could not be found.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-brand px-5 text-sm font-bold text-white hover:bg-brand-dark"
        >
          Return to GIWESA
        </Link>
      </div>
    </main>
  );
}
