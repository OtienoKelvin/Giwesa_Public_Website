import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const focusAreas = [
  { label: "Financial inclusion", detail: "Practical access and know-how" },
  { label: "Enterprise", detail: "Livelihoods with room to grow" },
  { label: "Education", detail: "Confidence through learning" },
  { label: "Partnerships", detail: "Progress built together" },
];

export function CommunitySection() {
  return (
    <section className="relative overflow-hidden bg-leaf-light">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 size-[28rem] rounded-full border border-leaf/20"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 top-8 size-[18rem] rounded-full border border-leaf/20"
      />

      <div className="container-page section-space relative">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <p className="eyebrow">Community &amp; empowerment</p>
            <h2 className="mt-5 font-display text-[2.5rem] leading-[1.05] text-brand-dark sm:text-5xl">
              Progress is rarely a solo project.
            </h2>
            <p className="mt-5 max-w-sm text-[0.9375rem] leading-7 text-ink-muted">
              Our work is shaped around financial inclusion, education, enterprise, welfare and
              partnerships that create lasting local value.
            </p>
            <Link
              href="/solutions/community-development"
              className="group mt-7 inline-flex items-center gap-2 text-sm font-bold text-brand"
            >
              <span className="link-underline">Our community approach</span>
              <ArrowUpRight
                className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </div>

          <div className="lg:col-span-8">
            <figure className="border-l-2 border-sun pl-6 sm:pl-9">
              <span aria-hidden="true" className="font-display text-6xl leading-none text-sun">
                “
              </span>
              <blockquote className="mt-1 max-w-3xl font-display text-[1.75rem] leading-[1.38] text-brand-dark sm:text-[2.2rem]">
                To empower communities through financial inclusion, education, welfare programmes,
                and strategic partnerships for sustainable socio-economic growth.
              </blockquote>
              <figcaption className="mt-5 text-[0.625rem] font-bold uppercase tracking-[0.16em] text-leaf-dark">
                The GIWESA mission
              </figcaption>
            </figure>

            <div className="mt-10 grid gap-x-6 gap-y-5 border-t border-leaf/25 pt-7 sm:grid-cols-2 lg:grid-cols-4">
              {focusAreas.map((area, index) => (
                <div key={area.label}>
                  <p className="text-[0.625rem] font-bold tracking-[0.14em] text-leaf-dark">
                    0{index + 1}
                  </p>
                  <p className="mt-2 text-sm font-bold text-brand-dark">{area.label}</p>
                  <p className="mt-1 text-xs leading-5 text-ink-muted">{area.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
