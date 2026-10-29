import Link from "next/link";
import { Search } from "lucide-react";

export default function PublicNotFound() {
  return (
    <section className="paper-glow">
      <div className="container-page flex min-h-[60vh] max-w-2xl flex-col justify-center py-20">
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-brand-light text-brand">
          <Search className="size-5" aria-hidden="true" />
        </span>
        <p className="eyebrow mt-6">404</p>
        <h1 className="mt-4 font-display text-5xl leading-[1.05] text-brand-dark sm:text-6xl">
          That page has moved on.
        </h1>
        <p className="mt-4 max-w-md text-[1.0625rem] leading-8 text-ink-muted">
          The page you are looking for may have been renamed or removed. The homepage and solutions
          pages are a good place to pick up again.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand px-5 text-sm font-bold text-white hover:bg-brand-dark"
          >
            Return home
          </Link>
          <Link
            href="/solutions"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-line-strong px-5 text-sm font-bold text-ink hover:border-brand"
          >
            Explore solutions
          </Link>
        </div>
      </div>
    </section>
  );
}
