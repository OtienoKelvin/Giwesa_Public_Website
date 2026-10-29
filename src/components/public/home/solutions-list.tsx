import Link from "next/link";
import { ArrowUpRight, ShieldCheck, Sparkles, Sprout, Users } from "lucide-react";

import type { PublicProductCard } from "@/domains/products/service";

const icons = {
  sprout: Sprout,
  shield: ShieldCheck,
  people: Users,
  spark: Sparkles,
} as const;

export function SolutionsList({ products }: { products: PublicProductCard[] }) {
  return (
    <div className="border-y border-line">
      {products.map((product, index) => {
        const Icon = icons[product.iconKey as keyof typeof icons] ?? Sparkles;
        return (
          <Link
            key={product.id}
            href={`/solutions/${product.slug}`}
            className="group relative grid grid-cols-[2.5rem_1fr_2.75rem] items-start gap-x-3 gap-y-3 border-b border-line py-7 transition-colors last:border-b-0 hover:bg-white/55 sm:grid-cols-[3.5rem_1fr_auto] sm:px-4 sm:py-8 lg:grid-cols-[4.5rem_1fr_18rem_auto] lg:gap-6 lg:px-5"
          >
            <span className="font-display text-3xl leading-none text-line-strong transition-colors group-hover:text-sun lg:text-4xl">
              {String(index + 1).padStart(2, "0")}
            </span>

            <span className="min-w-0">
              <span className="flex items-center gap-2 text-[0.625rem] font-bold uppercase tracking-[0.17em] text-leaf-dark">
                <Icon className="size-3.5" aria-hidden="true" />
                {product.eyebrow}
              </span>
              <span className="mt-2 block font-display text-[1.9rem] leading-tight text-brand-dark transition-colors group-hover:text-brand sm:text-3xl">
                {product.name}
              </span>
              <span className="mt-2 block text-sm font-medium leading-6 text-ink-muted">
                {product.tagline}
              </span>
            </span>

            <span className="hidden self-center text-sm leading-6 text-ink-muted lg:block">
              {product.summary}
            </span>

            <span className="justify-self-end self-start rounded-full border border-line-strong bg-canvas p-0 text-brand transition-all duration-200 group-hover:border-brand group-hover:bg-brand group-hover:text-white sm:self-center">
              <span className="flex size-11 items-center justify-center">
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
