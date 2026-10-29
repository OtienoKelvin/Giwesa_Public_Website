import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";

export function AudienceStrip() {
  const groups = ["Individuals", "Families", "Small businesses", "Community institutions"];
  return (
    <section className="border-b border-line bg-paper">
      <div className="container-page grid gap-6 py-10 md:grid-cols-[12rem_1fr] md:items-center md:gap-12 lg:py-12">
        <p className="eyebrow">Who it is for</p>
        <div>
          <p className="max-w-3xl font-display text-[1.6rem] leading-[1.3] text-brand-dark sm:text-[1.9rem]">
            For people building a livelihood, families planning ahead, and institutions creating
            opportunity close to home.
          </p>
          <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
            {groups.map((group) => (
              <li
                key={group}
                className="inline-flex items-center gap-2 text-xs font-semibold text-ink-muted"
              >
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-leaf-light text-leaf-dark">
                  <Check className="size-3" aria-hidden="true" />
                </span>
                {group}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function WhyGiwesa() {
  const points = [
    {
      title: "Rooted where we work",
      body: "Our head office is in Homa Bay, and our approach starts with the people, enterprises and institutions around us.",
    },
    {
      title: "Clear before you commit",
      body: "Published terms, plain-language explanations and a team you can question before making a decision.",
    },
    {
      title: "The whole picture",
      body: "Savings, credit, welfare and community support can be considered together, not in isolation.",
    },
    {
      title: "Relationships first",
      body: "A financial decision is personal. We aim to treat every conversation that way.",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-brand-dark text-inverse">
      <div aria-hidden="true" className="absolute inset-0 opacity-30">
        <svg viewBox="0 0 1200 800" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
          <circle cx="1050" cy="120" r="330" fill="none" stroke="#ffffff" strokeWidth="1" />
          <circle cx="1050" cy="120" r="250" fill="none" stroke="#ffffff" strokeWidth="1" />
          <path
            d="M-100 700 C200 430 540 560 1300 150"
            fill="none"
            stroke="#61a627"
            strokeWidth="80"
            opacity=".22"
          />
        </svg>
      </div>

      <div className="container-page section-space relative grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <p className="eyebrow eyebrow-inverse">Why GIWESA</p>
          <h2 className="mt-5 font-display text-[2.5rem] leading-[1.04] text-inverse sm:text-5xl lg:text-[3.4rem]">
            Financial services should feel
            <span className="text-[#e9d8b2]"> understandable.</span>
          </h2>
          <p className="mt-6 max-w-md text-[1.0625rem] leading-8 text-inverse-muted">
            We are a Kenyan organisation with a simple belief: access to finance works best when the
            terms are clear and the relationship is human.
          </p>
          <Link
            href="/about"
            className="group mt-8 inline-flex items-center gap-2 text-sm font-bold text-white"
          >
            <span className="link-underline">More about GIWESA</span>
            <ArrowUpRight
              className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
          <div className="mt-10 border-t border-white/15 pt-6">
            <p className="font-display text-xl italic text-[#e9d8b2]">
              Empowering communities. Building prosperity.
            </p>
          </div>
        </div>

        <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:col-span-7">
          {points.map((point, index) => (
            <div key={point.title} className="border-t border-white/20 pt-5">
              <p className="text-[0.625rem] font-bold tracking-[0.18em] text-[#e7d6ad]">
                0{index + 1}
              </p>
              <h3 className="mt-3 font-sans text-lg font-bold tracking-normal text-white">
                {point.title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-inverse-muted">{point.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
