import type { ProductTerm } from "@/config/site";

export function ProductTerms({ terms }: { terms: ProductTerm[] }) {
  return (
    <div className="space-y-10">
      {terms.map((term) => (
        <section
          key={term.title}
          aria-labelledby={`term-${term.title.replace(/\s+/g, "-").toLowerCase()}`}
        >
          <h2
            id={`term-${term.title.replace(/\s+/g, "-").toLowerCase()}`}
            className="font-display text-3xl text-brand-dark sm:text-4xl"
          >
            {term.title}
          </h2>
          {term.description ? (
            <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-muted">{term.description}</p>
          ) : null}

          {term.rows?.length ? (
            <dl className="mt-6 divide-y divide-line border-y border-line">
              {term.rows.map((row) => (
                <div key={row.label} className="grid gap-1 py-4 sm:grid-cols-[13rem_1fr] sm:gap-6">
                  <dt className="text-xs font-bold uppercase tracking-[0.1em] text-ink-muted">
                    {row.label}
                  </dt>
                  <dd className="text-sm font-semibold leading-6 text-brand-dark">{row.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {term.packages?.length ? (
            <div className="mt-6 overflow-hidden rounded-2xl border border-line-strong bg-paper">
              <table className="w-full border-collapse text-left">
                <caption className="sr-only">Package monthly cost and cash benefit</caption>
                <thead>
                  <tr className="border-b border-line bg-white text-[0.625rem] uppercase tracking-[0.12em] text-ink-muted">
                    <th scope="col" className="px-5 py-3.5 font-bold">
                      Package
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right font-bold">
                      Monthly
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-right font-bold">
                      Cash benefit
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {term.packages.map((item) => (
                    <tr key={item.name} className="border-b border-line/75 last:border-0">
                      <th scope="row" className="px-5 py-4 text-sm font-semibold text-brand-dark">
                        {item.name}
                      </th>
                      <td className="numeric px-3 py-4 text-right text-sm text-ink-muted">
                        {item.monthly}
                      </td>
                      <td className="numeric px-5 py-4 text-right text-sm font-bold text-brand-dark">
                        {item.benefit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {term.support?.length ? (
            <div className="mt-6 rounded-2xl border border-line bg-white p-5 sm:p-6">
              <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-leaf-dark">
                Included support
              </p>
              <ul className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {term.support.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm leading-6 text-ink-muted">
                    <span
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-sun"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ))}
    </div>
  );
}
