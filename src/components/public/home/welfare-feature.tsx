import Link from "next/link";
import { ArrowRight, ArrowUpRight, ShieldCheck } from "lucide-react";

import { PRODUCT_TERMS } from "@/config/site";
import { ButtonLink } from "@/components/ui/button";

export function WelfareFeature() {
  const terms = PRODUCT_TERMS["welfare-protection"]?.[0];
  const packages = terms?.packages ?? [];
  const support = terms?.support ?? [];

  return (
    <section className="border-b border-line bg-muted">
      <div className="container-page section-space grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5 lg:self-center">
          <p className="eyebrow">Welfare protection</p>
          <h2 className="mt-5 font-display text-[2.5rem] leading-[1.05] text-brand-dark sm:text-5xl">
            Support that shows up for families.
          </h2>
          <p className="mt-5 max-w-md text-[1.0625rem] leading-8 text-ink-muted">
            Monthly welfare packages provide a defined cash benefit and practical bereavement
            support. Five package levels make it easier to choose a contribution that fits your
            household.
          </p>

          <dl className="mt-7 grid max-w-md grid-cols-2 gap-4 border-y border-line-strong/60 py-5">
            <div>
              <dt className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-ink-muted">
                Monthly from
              </dt>
              <dd className="mt-1 font-display text-2xl text-brand-dark">KES 100</dd>
            </div>
            <div>
              <dt className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-ink-muted">
                Benefits up to
              </dt>
              <dd className="mt-1 font-display text-2xl text-brand-dark">KES 100,000</dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <ButtonLink href="/solutions/welfare-protection" variant="primary" size="md">
              See welfare packages
              <ArrowRight className="size-4" aria-hidden="true" />
            </ButtonLink>
            <Link
              href="/book"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-brand"
            >
              <span className="link-underline">Talk it through</span>
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="overflow-hidden rounded-2xl border border-line-strong/70 bg-paper shadow-[var(--shadow-soft-value)]">
            <div className="flex flex-col gap-2 border-b border-line bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex size-9 items-center justify-center rounded-full bg-leaf-light text-leaf-dark">
                  <ShieldCheck className="size-4" aria-hidden="true" />
                </span>
                <p className="text-sm font-bold text-brand-dark">GIWESA welfare packages</p>
              </div>
              <p className="text-[0.625rem] font-bold uppercase tracking-[0.13em] text-ink-muted">
                One-time registration: KES 200
              </p>
            </div>

            <table className="w-full border-collapse text-left">
              <caption className="sr-only">
                GIWESA welfare package monthly costs and cash benefits
              </caption>
              <thead>
                <tr className="border-b border-line bg-canvas/80 text-[0.625rem] uppercase tracking-[0.12em] text-ink-muted">
                  <th scope="col" className="px-5 py-3 font-bold sm:px-6">
                    Package
                  </th>
                  <th scope="col" className="px-3 py-3 text-right font-bold">
                    Monthly
                  </th>
                  <th scope="col" className="px-5 py-3 text-right font-bold sm:px-6">
                    Benefit
                  </th>
                </tr>
              </thead>
              <tbody>
                {packages.map((item) => (
                  <tr key={item.name} className="border-b border-line/75 last:border-0">
                    <th
                      scope="row"
                      className="px-5 py-3.5 text-sm font-semibold text-brand-dark sm:px-6"
                    >
                      {item.name}
                    </th>
                    <td className="numeric px-3 py-3.5 text-right text-sm text-ink-muted">
                      {item.monthly}
                    </td>
                    <td className="numeric px-5 py-3.5 text-right text-sm font-bold text-brand-dark sm:px-6">
                      {item.benefit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-line bg-white px-5 py-5 sm:px-6">
              <p className="text-[0.625rem] font-bold uppercase tracking-[0.13em] text-leaf-dark">
                Additional support
              </p>
              <ul className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
                {support.slice(0, 4).map((item) => (
                  <li key={item} className="flex gap-2 text-xs leading-5 text-ink-muted">
                    <span
                      className="mt-1.5 size-1 shrink-0 rounded-full bg-sun"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[0.6875rem] leading-5 text-ink-muted">
                Published package levels. Maturity and full terms are confirmed before registration.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
