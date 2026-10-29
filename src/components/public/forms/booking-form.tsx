"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, CalendarClock, CheckCircle2, Loader2, Send } from "lucide-react";

import { INTEREST_OPTIONS, PREFERRED_TIMES } from "@/config/site";
import { bookingSchema } from "@/domains/bookings/schema";
import { Button } from "@/components/ui/button";

const formSchema = bookingSchema.omit({ startedAt: true, privacy: true }).extend({
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
    areaOfInterest: "savings-and-loans",
    preferredDate: "",
    preferredTime: "MORNING",
    message: "",
    privacy: false,
    company: "",
  };
}

export function BookingForm() {
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
      const response = await fetch("/api/bookings", {
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
        setStatus(payload?.error || "Your request could not be sent. Please try again.");
        return;
      }

      setSuccess(true);
      reset(emptyValues());
      setStartedAt(clockNow());
    } catch {
      setStatus("Your request could not be sent. Check your connection and try again.");
    }
  });

  if (success) {
    return (
      <div className="rounded-2xl border border-leaf/30 bg-leaf-light p-7 sm:p-8" role="status">
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-white text-leaf-dark">
          <CheckCircle2 className="size-6" aria-hidden="true" />
        </span>
        <h2 className="mt-5 font-display text-3xl text-brand-dark">Request received.</h2>
        <p className="mt-3 max-w-md text-sm leading-7 text-ink-muted">
          This is a request, not a confirmed appointment. The GIWESA team will use the details you
          provided to get in touch and agree a time.
        </p>
        <Button type="button" variant="secondary" className="mt-6" onClick={startAnother}>
          Send another request
        </Button>
      </div>
    );
  }

  return (
    <form id="booking-form" onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="flex gap-3 rounded-xl border border-line bg-canvas p-4">
        <CalendarClock className="mt-0.5 size-4 shrink-0 text-leaf-dark" aria-hidden="true" />
        <p className="text-xs leading-5 text-ink-muted">
          <span className="font-bold text-brand-dark">
            This is a request, not a confirmed appointment.
          </span>{" "}
          Our team will contact you to agree a time.
        </p>
      </div>

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
          <label htmlFor="booking-name" className="field-label">
            Full name{" "}
            <span className="text-danger" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id="booking-name"
            type="text"
            autoComplete="name"
            placeholder="e.g. Akinyi Otieno"
            className="field"
            aria-required="true"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "booking-name-error" : undefined}
            {...register("name")}
          />
          {errors.name ? (
            <p id="booking-name-error" className="field-error" role="alert">
              {errors.name.message}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="booking-phone" className="field-label">
            Phone number{" "}
            <span className="text-danger" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id="booking-phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="e.g. 0712 345 678"
            className="field"
            aria-required="true"
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={errors.phone ? "booking-phone-error" : undefined}
            {...register("phone")}
          />
          {errors.phone ? (
            <p id="booking-phone-error" className="field-error" role="alert">
              {errors.phone.message}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="booking-email" className="field-label">
          Email address{" "}
          <span className="text-danger" aria-hidden="true">
            *
          </span>
        </label>
        <input
          id="booking-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="field"
          aria-required="true"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "booking-email-error" : undefined}
          {...register("email")}
        />
        {errors.email ? (
          <p id="booking-email-error" className="field-error" role="alert">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="booking-area" className="field-label">
          Area of interest{" "}
          <span className="text-danger" aria-hidden="true">
            *
          </span>
        </label>
        <select
          id="booking-area"
          className="field"
          aria-required="true"
          aria-invalid={errors.areaOfInterest ? true : undefined}
          aria-describedby={errors.areaOfInterest ? "booking-area-error" : undefined}
          {...register("areaOfInterest")}
        >
          {INTEREST_OPTIONS.map((area) => (
            <option key={area.value} value={area.value}>
              {area.label}
            </option>
          ))}
        </select>
        {errors.areaOfInterest ? (
          <p id="booking-area-error" className="field-error" role="alert">
            {errors.areaOfInterest.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="booking-date" className="field-label">
            Preferred date{" "}
            <span className="text-danger" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id="booking-date"
            type="date"
            className="field"
            aria-required="true"
            aria-invalid={errors.preferredDate ? true : undefined}
            aria-describedby={errors.preferredDate ? "booking-date-error" : "booking-date-hint"}
            {...register("preferredDate")}
          />
          {errors.preferredDate ? (
            <p id="booking-date-error" className="field-error" role="alert">
              {errors.preferredDate.message}
            </p>
          ) : (
            <p id="booking-date-hint" className="field-hint">
              Choose today or a date within the next year.
            </p>
          )}
        </div>
        <div>
          <label htmlFor="booking-time" className="field-label">
            Preferred time{" "}
            <span className="text-danger" aria-hidden="true">
              *
            </span>
          </label>
          <select
            id="booking-time"
            className="field"
            aria-required="true"
            aria-invalid={errors.preferredTime ? true : undefined}
            aria-describedby={errors.preferredTime ? "booking-time-error" : undefined}
            {...register("preferredTime")}
          >
            {PREFERRED_TIMES.map((time) => (
              <option key={time.value} value={time.value}>
                {time.label}
              </option>
            ))}
          </select>
          {errors.preferredTime ? (
            <p id="booking-time-error" className="field-error" role="alert">
              {errors.preferredTime.message}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="booking-message" className="field-label">
          Anything we should know? <span className="font-medium text-ink-muted">(optional)</span>
        </label>
        <textarea
          id="booking-message"
          rows={4}
          placeholder="A little context helps us prepare for the conversation."
          className="field min-h-28 resize-y"
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? "booking-message-error" : "booking-message-hint"}
          {...register("message")}
        />
        {errors.message ? (
          <p id="booking-message-error" className="field-error" role="alert">
            {errors.message.message}
          </p>
        ) : (
          <p id="booking-message-hint" className="field-hint">
            Please do not include passwords, PINs or account numbers.
          </p>
        )}
      </div>

      <div>
        <div className="flex items-start gap-3 rounded-xl border border-line bg-canvas p-4">
          <input
            id="booking-privacy"
            type="checkbox"
            className="mt-0.5 size-4 shrink-0 accent-[var(--brand-primary)]"
            aria-required="true"
            aria-invalid={errors.privacy ? true : undefined}
            aria-describedby={errors.privacy ? "booking-privacy-error" : undefined}
            {...register("privacy")}
          />
          <label htmlFor="booking-privacy" className="text-xs leading-5 text-ink-muted">
            I agree that GIWESA may use the details I provide to respond to this request. See the{" "}
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
          <p id="booking-privacy-error" className="field-error" role="alert">
            {errors.privacy.message}
          </p>
        ) : null}
      </div>

      <div
        className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
        aria-hidden="true"
      >
        <label htmlFor="booking-company">Company</label>
        <input
          id="booking-company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register("company")}
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xs text-[0.6875rem] leading-5 text-ink-muted">
          Your contact details stay private and are only used to manage this request.
        </p>
        <Button type="submit" disabled={isSubmitting} className="min-w-48 justify-between">
          {isSubmitting ? (
            <>
              Sending request
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            </>
          ) : (
            <>
              Request consultation
              <Send className="size-4" aria-hidden="true" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
