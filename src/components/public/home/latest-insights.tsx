import { SectionHeading } from "@/components/public/section-heading";
import { ArticleCard } from "@/components/public/article-card";
import type { PublicPostCard } from "@/domains/blog/service";
import { ButtonLink } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function LatestInsights({ posts }: { posts: PublicPostCard[] }) {
  const [featured, ...rest] = posts;

  return (
    <section className="border-b border-line bg-canvas" id="insights">
      <div className="container-page section-space">
        <SectionHeading
          eyebrow="Insights & education"
          title="Useful reading, not financial noise."
          description="Plain-language articles on saving, borrowing, family protection and the everyday decisions that shape financial wellbeing."
          action={{ href: "/insights", label: "All insights" }}
        />

        {!featured ? (
          <div className="mt-10 rounded-2xl border border-dashed border-line-strong bg-paper px-6 py-10">
            <p className="font-display text-2xl text-brand-dark">Insights are being prepared.</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-ink-muted">
              In the meantime, our team is happy to answer a question directly.
            </p>
            <ButtonLink href="/contact" variant="secondary" className="mt-5">
              Talk to GIWESA
              <ArrowRight className="size-4" aria-hidden="true" />
            </ButtonLink>
          </div>
        ) : (
          <div className="mt-11 grid gap-10 lg:grid-cols-12 lg:gap-12">
            <ArticleCard post={featured} variant="feature" priority className="lg:col-span-7" />
            <div className="flex flex-col divide-y divide-line border-t border-line lg:col-span-5">
              {rest.slice(0, 2).map((post) => (
                <ArticleCard
                  key={post.id}
                  post={post}
                  variant="compact"
                  className="py-6 first:pt-6 last:pb-0"
                />
              ))}
              {rest.length === 0 ? (
                <div className="py-7">
                  <p className="text-sm leading-6 text-ink-muted">
                    More practical guidance will appear here as it is published.
                  </p>
                  <ButtonLink href="/insights" variant="secondary" size="sm" className="mt-4">
                    Visit insights
                  </ButtonLink>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
