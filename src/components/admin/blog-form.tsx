"use client";

import { useEffect, useState, useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle, Eye, ImagePlus, Loader2, Save, Send } from "lucide-react";

import { BLOG_CATEGORIES } from "@/config/site";
import { savePostAction } from "@/app/admin/(dashboard)/blog/actions";
import { INITIAL_ACTION_STATE, type ActionState } from "@/lib/action-state";

type InitialPost = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  authorName: string;
  coverImage: string | null;
  coverAlt: string | null;
  status: string;
  seoTitle: string | null;
  seoDescription: string | null;
};

function errorFor(state: ActionState, key: string) {
  return state.fields?.[key]?.[0];
}

export function BlogPostForm({ initial, adminName }: { initial?: InitialPost; adminName: string }) {
  const [state, formAction, pending] = useActionState(savePostAction, INITIAL_ACTION_STATE);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initial?.coverImage ?? null);
  const [fileError, setFileError] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const value = (key: string, fallback = "") => state.values?.[key] ?? fallback;
  const isPublished = initial?.status === "PUBLISHED";

  return (
    <form
      action={formAction}
      encType="multipart/form-data"
      className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]"
    >
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
          <h2 className="text-sm font-bold text-brand-dark">Article</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="post-title" className="field-label">
                Title{" "}
                <span className="text-danger" aria-hidden="true">
                  *
                </span>
              </label>
              <input
                id="post-title"
                name="title"
                type="text"
                defaultValue={value("title", initial?.title)}
                className="field"
                maxLength={140}
                aria-invalid={errorFor(state, "title") ? true : undefined}
              />
              {errorFor(state, "title") ? (
                <p className="field-error" role="alert">
                  {errorFor(state, "title")}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="post-excerpt" className="field-label">
                Excerpt{" "}
                <span className="text-danger" aria-hidden="true">
                  *
                </span>
              </label>
              <textarea
                id="post-excerpt"
                name="excerpt"
                rows={3}
                defaultValue={value("excerpt", initial?.excerpt)}
                className="field min-h-22 resize-y"
                maxLength={320}
                aria-describedby="post-excerpt-hint"
                aria-invalid={errorFor(state, "excerpt") ? true : undefined}
              />
              <p id="post-excerpt-hint" className="field-hint">
                Used on article cards and in search descriptions. Up to 320 characters.
              </p>
              {errorFor(state, "excerpt") ? (
                <p className="field-error" role="alert">
                  {errorFor(state, "excerpt")}
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="post-category" className="field-label">
                  Category{" "}
                  <span className="text-danger" aria-hidden="true">
                    *
                  </span>
                </label>
                <select
                  id="post-category"
                  name="category"
                  defaultValue={value("category", initial?.category ?? "FINANCIAL_WELLBEING")}
                  className="field"
                >
                  {BLOG_CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="post-author" className="field-label">
                  Author{" "}
                  <span className="text-danger" aria-hidden="true">
                    *
                  </span>
                </label>
                <input
                  id="post-author"
                  name="authorName"
                  type="text"
                  defaultValue={value("authorName", initial?.authorName ?? adminName)}
                  className="field"
                  maxLength={80}
                  aria-invalid={errorFor(state, "authorName") ? true : undefined}
                />
                {errorFor(state, "authorName") ? (
                  <p className="field-error" role="alert">
                    {errorFor(state, "authorName")}
                  </p>
                ) : null}
              </div>
            </div>

            <div>
              <label htmlFor="post-content" className="field-label">
                Content{" "}
                <span className="text-danger" aria-hidden="true">
                  *
                </span>
              </label>
              <textarea
                id="post-content"
                name="content"
                rows={22}
                defaultValue={value("content", initial?.content)}
                className="field min-h-[30rem] resize-y font-sans text-[0.875rem] leading-7"
                maxLength={50_000}
                aria-describedby="post-content-hint"
                aria-invalid={errorFor(state, "content") ? true : undefined}
              />
              <p id="post-content-hint" className="field-hint">
                Write in Markdown. Raw HTML is not accepted. Use the guide in the sidebar for
                headings, lists and links.
              </p>
              {errorFor(state, "content") ? (
                <p className="field-error" role="alert">
                  {errorFor(state, "content")}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="admin-card p-5 sm:p-6">
          <h2 className="text-sm font-bold text-brand-dark">Search appearance</h2>
          <p className="mt-1 text-xs leading-5 text-ink-muted">
            Optional. If left blank, the site uses the title and excerpt.
          </p>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="post-seo-title" className="field-label">
                SEO title
              </label>
              <input
                id="post-seo-title"
                name="seoTitle"
                type="text"
                defaultValue={value("seoTitle", initial?.seoTitle ?? "")}
                className="field"
                maxLength={70}
              />
              <p className="field-hint">Aim for 50–60 characters.</p>
            </div>
            <div>
              <label htmlFor="post-seo-description" className="field-label">
                SEO description
              </label>
              <textarea
                id="post-seo-description"
                name="seoDescription"
                rows={2}
                defaultValue={value("seoDescription", initial?.seoDescription ?? "")}
                className="field resize-y"
                maxLength={160}
              />
              <p className="field-hint">Aim for 140–160 characters.</p>
            </div>
          </div>
        </section>
      </div>

      <aside className="space-y-5">
        <section className="admin-card p-5">
          <h2 className="text-sm font-bold text-brand-dark">Publication</h2>
          <dl className="mt-4 space-y-2 border-y border-admin-line py-3 text-[0.6875rem]">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">Status</dt>
              <dd className="font-bold text-brand-dark">
                {initial?.status ? initial.status.toLowerCase() : "new draft"}
              </dd>
            </div>
            {initial ? (
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Article ID</dt>
                <dd className="max-w-[10rem] truncate text-right font-mono text-[0.625rem] text-ink-muted">
                  {initial.id}
                </dd>
              </div>
            ) : null}
          </dl>

          <div className="mt-4 flex flex-col gap-2">
            <button
              type="submit"
              name="intent"
              value="save"
              disabled={pending}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand px-4 text-xs font-bold text-white hover:bg-brand-dark disabled:opacity-60"
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="size-4" aria-hidden="true" />
              )}
              {initial ? "Save changes" : "Save draft"}
            </button>
            {!isPublished ? (
              <button
                type="submit"
                name="intent"
                value="publish"
                disabled={pending}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-brand bg-white px-4 text-xs font-bold text-brand hover:bg-brand-light disabled:opacity-60"
              >
                <Send className="size-4" aria-hidden="true" />
                {initial ? "Save & publish" : "Publish article"}
              </button>
            ) : null}
            {initial ? (
              <Link
                href={`/admin/blog/${initial.id}/preview`}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-admin-line px-4 text-xs font-bold text-ink-muted hover:border-brand hover:text-brand"
              >
                <Eye className="size-4" aria-hidden="true" />
                Preview saved article
              </Link>
            ) : (
              <p className="px-1 text-[0.6875rem] leading-5 text-ink-muted">
                Save the draft to preview it.
              </p>
            )}
          </div>
        </section>

        <section className="admin-card p-5">
          <h2 className="text-sm font-bold text-brand-dark">Cover image</h2>
          <div className="mt-3 overflow-hidden rounded-lg border border-admin-line bg-admin-canvas">
            {previewUrl ? (
              <div className="relative aspect-[16/10]">
                <Image
                  src={previewUrl}
                  alt="Selected cover preview"
                  fill
                  unoptimized
                  sizes="320px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex aspect-[16/10] items-center justify-center text-ink-muted">
                <ImagePlus className="size-8" aria-hidden="true" />
              </div>
            )}
          </div>
          <div className="mt-4">
            <label htmlFor="post-cover" className="field-label">
              Upload new image
            </label>
            <input
              id="post-cover"
              name="cover"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="block w-full cursor-pointer rounded-lg border border-admin-line bg-white p-2 text-xs text-ink-muted file:mr-3 file:rounded-md file:border-0 file:bg-brand-light file:px-3 file:py-2 file:text-[0.6875rem] file:font-bold file:text-brand"
              onChange={(event) => {
                const file = event.target.files?.[0];
                setFileError("");
                if (!file) {
                  setPreviewUrl(initial?.coverImage ?? null);
                  return;
                }
                if (file.size > 4 * 1024 * 1024) {
                  setFileError("The image must be 4 MB or smaller.");
                  event.target.value = "";
                  return;
                }
                if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
                setPreviewUrl(URL.createObjectURL(file));
              }}
              aria-describedby="post-cover-hint"
            />
            <p id="post-cover-hint" className="field-hint">
              JPEG, PNG, WebP or AVIF. Automatically resized to 1600 × 1000 and re-encoded as WebP.
            </p>
            {fileError ? (
              <p className="field-error" role="alert">
                {fileError}
              </p>
            ) : null}
            {errorFor(state, "cover") ? (
              <p className="field-error" role="alert">
                {errorFor(state, "cover")}
              </p>
            ) : null}
          </div>

          <div className="mt-4">
            <label htmlFor="post-cover-alt" className="field-label">
              Cover image description
            </label>
            <input
              id="post-cover-alt"
              name="coverAlt"
              type="text"
              defaultValue={value("coverAlt", initial?.coverAlt ?? "")}
              className="field"
              maxLength={180}
              aria-describedby="post-cover-alt-hint"
              aria-invalid={errorFor(state, "coverAlt") ? true : undefined}
            />
            <p id="post-cover-alt-hint" className="field-hint">
              Describe the image for screen-reader users. Required when a cover is set.
            </p>
            {errorFor(state, "coverAlt") ? (
              <p className="field-error" role="alert">
                {errorFor(state, "coverAlt")}
              </p>
            ) : null}
          </div>

          {initial?.coverImage ? (
            <label className="mt-4 flex items-center gap-2 text-[0.6875rem] font-semibold text-ink-muted">
              <input
                type="checkbox"
                name="removeCover"
                className="size-3.5 accent-[var(--brand-primary)]"
              />
              Remove current cover
            </label>
          ) : null}
        </section>

        <section className="admin-card p-5">
          <h2 className="text-sm font-bold text-brand-dark">Markdown guide</h2>
          <dl className="mt-3 space-y-2 text-[0.6875rem] leading-5">
            <div className="flex gap-3">
              <dt className="w-16 shrink-0 font-mono text-brand">##</dt>
              <dd className="text-ink-muted">Section heading</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-16 shrink-0 font-mono text-brand">###</dt>
              <dd className="text-ink-muted">Smaller heading</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-16 shrink-0 font-mono text-brand">-</dt>
              <dd className="text-ink-muted">Bulleted list</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-16 shrink-0 font-mono text-brand">1.</dt>
              <dd className="text-ink-muted">Numbered list</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-16 shrink-0 font-mono text-brand">**text**</dt>
              <dd className="text-ink-muted">Bold</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-16 shrink-0 font-mono text-brand">[label](url)</dt>
              <dd className="text-ink-muted">Link</dd>
            </div>
          </dl>
          <p className="mt-3 border-t border-admin-line pt-3 text-[0.625rem] leading-5 text-ink-muted">
            Raw HTML is silently treated as text, never rendered as code.
          </p>
        </section>
      </aside>
    </form>
  );
}
