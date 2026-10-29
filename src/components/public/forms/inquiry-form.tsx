"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";

import { INQUIRY_SUBJECTS } from "@/config/site";
import { inquirySchema } from "@/domains/inquiries/schema";
import { Button } from "@/components/ui/button";

const formSchema = inquirySchema.omit({ startedAt: true, privacy: true }).extend({
  privacy: z.boolean().refine((value) => value === true, {
    message: "Please accept the privacy notice.",
  }),
});
type FormInput = z.input<typeof formSchema>;
type FormOutput = z.output<typeof formSchema>;

function clockNow(): number {
  return Date.now();
}

function emptyValues() {
  return {
    name: "",
    email: "",
    phone: "",
    subject: "general",
    message: "",
    privacy: false,
    company: "",
  };
}

export function InquiryForm() {
  const [startedAt, setStartedAt] = useState(() => clockNow());
  const [status, setStatus] = useState("");
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: emptyValues(),
  });

  function startAnother() {
    reset(emptyValues());
    setSuccess(false);
    setStatus("");
    setStartedAt(clockNow());
  }

  const onSubmit = handleSubmit(async (data) => {
    setStatus("");
    clearErrors();
    if (!startedAt) {
      setStatus("The form is still loading. Please try again.");
      return;
    }

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, startedAt }),
      });
      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        fields?: Record<string, string[]>;
      } | null;

      if (!response.ok) {
        if (payload?.fields) {
          for (const [field, messages] of Object.entries(payload.fields)) {
            if (messages[0] && field !== "startedAt" && field !== "company") {
              setError(field as keyof FormInput, { type: "server", message: messages[0] });
            }
          }
        }
        setStatus(payload?.error || "Your inquiry could not be sent. Please try again.");
        return;
      }

      setSuccess(true);
      reset(emptyValues());
      setStartedAt(clockNow());
    } catch {
      setStatus("Your inquiry could not be sent. Check your connection and try again.");
    }
  });

  if (success) {
    return (
      <div className="rounded-2xl border border-leaf/30 bg-leaf-light p-7 sm:p-8" role="status">
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-white text-leaf-dark">
          <CheckCircle2 className="size-6" aria-hidden="true" />
        </span>
        <h2 className="mt-5 font-display text-3xl text-brand-dark">Inquiry received.</h2>
        <p className="mt-3 max-w-md text-sm leading-7 text-ink-muted">
          Thank you for contacting GIWESA. Our team will use the details you provided to respond to
          your inquiry.
        </p>
        <Button type="button" variant="secondary" className="mt-6" onClick={startAnother}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form id="inquiry-form" onSubmit={onSubmit} noValidate className="space-y-5">
      {status ? (
        <div
          role="alert"
          className="flex gap-3 rounded-xl border border-danger/30 bg-danger-soft p-4 text-sm font-semibold leading-6 text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{status}</span>
        </div>
      ) : null}

      <p className="text-xs text-ink-muted">
        Fields marked <span className="font-bold text-danger">*</span> are required.
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="inquiry-name" className="field-label">
            Full name{" "}
            <span className="text-danger" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id="inquiry-name"
            type="text"
            autoComplete="name"
            placeholder="e.g. Akinyi Otieno"
            className="field"
            aria-required="true"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "inquiry-name-error" : undefined}
            {...register("name")}
          />
          {errors.name ? (
            <p id="inquiry-name-error" className="field-error" role="alert">
              {errors.name.message}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="inquiry-phone" className="field-label">
            Phone number{" "}
            <span className="text-danger" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id="inquiry-phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="e.g. 0712 345 678"
            className="field"
            aria-required="true"
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={errors.phone ? "inquiry-phone-error" : undefined}
            {...register("phone")}
          />
          {errors.phone ? (
            <p id="inquiry-phone-error" className="field-error" role="alert">
              {errors.phone.message}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="inquiry-email" className="field-label">
          Email address{" "}
          <span className="text-danger" aria-hidden="true">
            *
          </span>
        </label>
        <input
          id="inquiry-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="field"
          aria-required="true"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "inquiry-email-error" : "inquiry-email-hint"}
          {...register("email")}
        />
        {errors.email ? (
          <p id="inquiry-email-error" className="field-error" role="alert">
            {errors.email.message}
          </p>
        ) : (
          <p id="inquiry-email-hint" className="field-hint">
            We use this to respond to your inquiry.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="inquiry-subject" className="field-label">
          What can we help with?{" "}
          <span className="text-danger" aria-hidden="true">
            *
          </span>
        </label>
        <select
          id="inquiry-subject"
          className="field appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22none%22%20stroke%3D%22%235b6864%22%20stroke-width%3D%221.5%22%3E%3Cpath%20d%3D%22m4%206%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[position:right_1rem_center] bg-no-repeat pr-10"
          aria-required="true"
          aria-invalid={errors.subject ? true : undefined}
          aria-describedby={errors.subject ? "inquiry-subject-error" : undefined}
          {...register("subject")}
        >
          {INQUIRY_SUBJECTS.map((subject) => (
            <option key={subject.value} value={subject.value}>
              {subject.label}
            </option>
          ))}
        </select>
        {errors.subject ? (
          <p id="inquiry-subject-error" className="field-error" role="alert">
            {errors.subject.message}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="inquiry-message" className="field-label">
          Your message{" "}
          <span className="text-danger" aria-hidden="true">
            *
          </span>
        </label>
        <textarea
          id="inquiry-message"
          rows={5}
          placeholder="Tell us a little about your question or goal."
          className="field min-h-36 resize-y"
          aria-required="true"
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? "inquiry-message-error" : "inquiry-message-hint"}
          {...register("message")}
        />
        {errors.message ? (
          <p id="inquiry-message-error" className="field-error" role="alert">
            {errors.message.message}
          </p>
        ) : (
          <p id="inquiry-message-hint" className="field-hint">
            Please do not include passwords, PINs or account numbers.
          </p>
        )}
      </div>

      <div>
        <div className="flex items-start gap-3 rounded-xl border border-line bg-canvas p-4">
          <input
            id="inquiry-privacy"
            type="checkbox"
            className="mt-0.5 size-4 shrink-0 accent-[var(--brand-primary)]"
            aria-required="true"
            aria-invalid={errors.privacy ? true : undefined}
            aria-describedby={errors.privacy ? "inquiry-privacy-error" : undefined}
            {...register("privacy")}
          />
          <label htmlFor="inquiry-privacy" className="text-xs leading-5 text-ink-muted">
            I agree that GIWESA may use the details I provide to respond to this inquiry. See the{" "}
            <Link href="/privacy" className="font-bold text-brand underline underline-offset-2">
              privacy notice
            </Link>
            .{" "}
            <span className="text-danger" aria-hidden="true">
              *
            </span>
          </label>
        </div>
        {errors.privacy ? (
          <p id="inquiry-privacy-error" className="field-error" role="alert">
            {errors.privacy.message}
          </p>
        ) : null}
      </div>

      <div
        className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
        aria-hidden="true"
      >
        <label htmlFor="inquiry-company">Company</label>
        <input
          id="inquiry-company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register("company")}
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xs text-[0.6875rem] leading-5 text-ink-muted">
          Your details are private and are not published anywhere on this site.
        </p>
        <Button type="submit" disabled={isSubmitting} className="min-w-44 justify-between">
          {isSubmitting ? (
            <>
              Sending
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            </>
          ) : (
            <>
              Send inquiry
              <Send className="size-4" aria-hidden="true" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
