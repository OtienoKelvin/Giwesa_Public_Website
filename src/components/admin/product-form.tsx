"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle, ExternalLink, Loader2, Save } from "lucide-react";

import { saveProductAction } from "@/app/admin/(dashboard)/products/actions";
import { INITIAL_ACTION_STATE, type ActionState } from "@/lib/action-state";
import { PRODUCT_ICON_KEYS } from "@/config/site";

type InitialProduct = {
  id: string;
  slug: string;
  name: string;
  eyebrow: string;
  tagline: string;
  summary: string;
  overview: string;
  whoFor: string;
  howItWorks: string;
  benefits: string;
  notes: string | null;
  iconKey: string;
  featured: boolean;
  published: boolean;
  displayOrder: number;
  seoTitle: string | null;
  seoDescription: string | null;
};

function errorFor(state: ActionState, key: string) {
  return state.fields?.[key]?.[0];
}

export function ProductForm({ initial }: { initial?: InitialProduct }) {
  const [state, action, pending] = useActionState(saveProductAction, INITIAL_ACTION_STATE);
  const value = (key: string, fallback = "") => state.values?.[key] ?? fallback;

  return (
    <form action={action} className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}

      <div className="space-y-5">
        {state.status === "error" ? (
          <div
            role="alert"
            className="flex gap-3 rounded-xl border border-danger/30 bg-danger-soft p-4 text-xs font-semibold leading-5 text-danger"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{state.message}</span>
          </div>
        ) : null}

        <section className="admin-card p-5 sm:p-6">
          <h2 className="text-sm font-bold text-brand-dark">Solution details</h2>
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="product-name" className="field-label">
                  Name{" "}
                  <span className="text-danger" aria-hidden="true">
                    *
                  </span>
                </label>
                <input
                  id="product-name"
                  name="name"
                  type="text"
                  defaultValue={value("name", initial?.name)}
                  className="field"
                  maxLength={100}
                  aria-invalid={errorFor(state, "name") ? true : undefined}
                />
                {errorFor(state, "name") ? (
                  <p className="field-error" role="alert">
                    {errorFor(state, "name")}
                  </p>
                ) : null}
              </div>
              <div>
                <label htmlFor="product-slug" className="field-label">
                  URL slug
                </label>
                <input
                  id="product-slug"
                  name={initial ? undefined : "slug"}
                  type="text"
                  defaultValue={initial?.slug ?? value("slug")}
                  readOnly={Boolean(initial)}
                  className="field bg-[#f7f7f4] font-mono text-xs disabled:text-ink-muted"
                  placeholder="generated from the name if blank"
                  aria-describedby="product-slug-hint"
                  aria-invalid={errorFor(state, "slug") ? true : undefined}
                />
                <p id="product-slug-hint" className="field-hint">
                  {initial
                    ? "The public URL cannot be changed after creation."
                    : "Lowercase letters, numbers and hyphens."}
                </p>
                {errorFor(state, "slug") ? (
                  <p className="field-error" role="alert">
                    {errorFor(state, "slug")}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="product-eyebrow" className="field-label">
                  Eyebrow{" "}
                  <span className="text-danger" aria-hidden="true">
                    *
                  </span>
                </label>
                <input
                  id="product-eyebrow"
                  name="eyebrow"
                  type="text"
                  defaultValue={value("eyebrow", initial?.eyebrow)}
                  className="field"
                  maxLength={60}
                  aria-invalid={errorFor(state, "eyebrow") ? true : undefined}
                />
                {errorFor(state, "eyebrow") ? (
                  <p className="field-error" role="alert">
                    {errorFor(state, "eyebrow")}
                  </p>
                ) : null}
              </div>
              <div>
                <label htmlFor="product-icon" className="field-label">
                  Icon
                </label>
                <select
                  id="product-icon"
                  name="iconKey"
                  defaultValue={value("iconKey", initial?.iconKey ?? "spark")}
                  className="field"
                >
                  {PRODUCT_ICON_KEYS.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon.charAt(0).toUpperCase() + icon.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="product-tagline" className="field-label">
                Tagline{" "}
                <span className="text-danger" aria-hidden="true">
                  *
                </span>
              </label>
              <input
                id="product-tagline"
                name="tagline"
                type="text"
                defaultValue={value("tagline", initial?.tagline)}
                className="field"
                maxLength={140}
                aria-invalid={errorFor(state, "tagline") ? true : undefined}
              />
              {errorFor(state, "tagline") ? (
                <p className="field-error" role="alert">
                  {errorFor(state, "tagline")}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="product-summary" className="field-label">
                Summary{" "}
                <span className="text-danger" aria-hidden="true">
                  *
                </span>
              </label>
              <textarea
                id="product-summary"
                name="summary"
                rows={3}
                defaultValue={value("summary", initial?.summary)}
                className="field resize-y"
                maxLength={500}
                aria-invalid={errorFor(state, "summary") ? true : undefined}
              />
              {errorFor(state, "summary") ? (
                <p className="field-error" role="alert">
                  {errorFor(state, "summary")}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="product-overview" className="field-label">
                Overview{" "}
                <span className="text-danger" aria-hidden="true">
                  *
                </span>
              </label>
              <textarea
                id="product-overview"
                name="overview"
                rows={5}
                defaultValue={value("overview", initial?.overview)}
                className="field resize-y"
                maxLength={3000}
                aria-invalid={errorFor(state, "overview") ? true : undefined}
              />
              {errorFor(state, "overview") ? (
                <p className="field-error" role="alert">
                  {errorFor(state, "overview")}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="product-who" className="field-label">
                Who it is for{" "}
                <span className="text-danger" aria-hidden="true">
                  *
                </span>
              </label>
              <textarea
                id="product-who"
                name="whoFor"
                rows={4}
                defaultValue={value("whoFor", initial?.whoFor)}
                className="field resize-y"
                maxLength={1200}
                aria-invalid={errorFor(state, "whoFor") ? true : undefined}
              />
              {errorFor(state, "whoFor") ? (
                <p className="field-error" role="alert">
                  {errorFor(state, "whoFor")}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="product-how" className="field-label">
                How it works{" "}
                <span className="text-danger" aria-hidden="true">
                  *
                </span>
              </label>
              <textarea
                id="product-how"
                name="howItWorks"
                rows={6}
                defaultValue={value("howItWorks", initial?.howItWorks)}
                className="field resize-y"
                maxLength={3000}
                aria-describedby="product-how-hint"
                aria-invalid={errorFor(state, "howItWorks") ? true : undefined}
              />
              <p id="product-how-hint" className="field-hint">
                One step per line. Each line appears as a numbered step.
              </p>
              {errorFor(state, "howItWorks") ? (
                <p className="field-error" role="alert">
                  {errorFor(state, "howItWorks")}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="product-benefits" className="field-label">
                Benefits{" "}
                <span className="text-danger" aria-hidden="true">
                  *
                </span>
              </label>
              <textarea
                id="product-benefits"
                name="benefits"
                rows={5}
                defaultValue={value("benefits", initial?.benefits)}
                className="field resize-y"
                maxLength={2000}
                aria-describedby="product-benefits-hint"
                aria-invalid={errorFor(state, "benefits") ? true : undefined}
              />
              <p id="product-benefits-hint" className="field-hint">
                One benefit per line.
              </p>
              {errorFor(state, "benefits") ? (
                <p className="field-error" role="alert">
                  {errorFor(state, "benefits")}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="product-notes" className="field-label">
                Good to know
              </label>
              <textarea
                id="product-notes"
                name="notes"
                rows={3}
                defaultValue={value("notes", initial?.notes ?? "")}
                className="field resize-y"
                maxLength={2000}
              />
              <p className="field-hint">
                Optional. Published terms should only contain confirmed GIWESA information.
              </p>
            </div>
          </div>
        </section>

        <section className="admin-card p-5 sm:p-6">
          <h2 className="text-sm font-bold text-brand-dark">Search appearance</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="product-seo-title" className="field-label">
                SEO title
              </label>
              <input
                id="product-seo-title"
                name="seoTitle"
                type="text"
                defaultValue={value("seoTitle", initial?.seoTitle ?? "")}
                className="field"
                maxLength={70}
              />
            </div>
            <div>
              <label htmlFor="product-seo-description" className="field-label">
                SEO description
              </label>
              <textarea
                id="product-seo-description"
                name="seoDescription"
                rows={2}
                defaultValue={value("seoDescription", initial?.seoDescription ?? "")}
                className="field resize-y"
                maxLength={160}
              />
            </div>
          </div>
        </section>
      </div>

      <aside className="space-y-5">
        <section className="admin-card p-5">
          <h2 className="text-sm font-bold text-brand-dark">Visibility</h2>
          <div className="mt-4 space-y-3">
            <label className="flex items-start gap-3 rounded-lg border border-admin-line p-3">
              <input
                type="checkbox"
                name="published"
                defaultChecked={initial?.published ?? true}
                className="mt-0.5 size-4 accent-[var(--brand-primary)]"
              />
              <span>
                <span className="block text-xs font-bold text-brand-dark">Published</span>
                <span className="mt-0.5 block text-[0.6875rem] leading-5 text-ink-muted">
                  Visible on the public solutions pages.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-lg border border-admin-line p-3">
              <input
                type="checkbox"
                name="featured"
                defaultChecked={initial?.featured ?? false}
                className="mt-0.5 size-4 accent-[var(--brand-primary)]"
              />
              <span>
                <span className="block text-xs font-bold text-brand-dark">Featured</span>
                <span className="mt-0.5 block text-[0.6875rem] leading-5 text-ink-muted">
                  Marks this solution for prominence.
                </span>
              </span>
            </label>
            <div>
              <label htmlFor="product-order" className="field-label">
                Display order
              </label>
              <input
                id="product-order"
                name="displayOrder"
                type="number"
                min={0}
                max={999}
                defaultValue={value("displayOrder", String(initial?.displayOrder ?? 0))}
                className="field numeric"
              />
              <p className="field-hint">Lower numbers appear first.</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-brand px-4 text-xs font-bold text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="size-4" aria-hidden="true" />
            )}
            {initial ? "Save solution" : "Create solution"}
          </button>

          {initial?.published ? (
            <Link
              href={`/solutions/${initial.slug}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-full border border-admin-line text-[0.6875rem] font-bold text-ink-muted hover:border-brand hover:text-brand"
            >
              <ExternalLink className="size-3.5" aria-hidden="true" />
              View live page
            </Link>
          ) : null}
        </section>

        <section className="admin-card p-5">
          <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-ink-muted">
            Content standard
          </p>
          <p className="mt-2 text-xs leading-5 text-ink-muted">
            Do not add interest rates, limits, approval times or eligibility conditions unless they
            are confirmed GIWESA terms. The published rate card on the solution page is controlled
            separately.
          </p>
        </section>
      </aside>
    </form>
  );
}
