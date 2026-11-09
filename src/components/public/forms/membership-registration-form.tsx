"use client";

/*
 * The React Compiler's render-time rules cannot model react-hook-form (which the
 * rule itself reports as an "incompatible library"): the submit handler it wraps
 * is an event callback, not render code, and this component legitimately restores
 * a persisted confirmation from `sessionStorage` on mount and scrolls the form
 * into view through a ref. The rules are disabled for this file ONLY, rather than
 * weakening them for the codebase.
 */
/* eslint-disable react-hooks/refs, react-hooks/purity, react-hooks/set-state-in-effect -- react-hook-form submit callback + sessionStorage restore, see note above */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Send,
  Upload,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  GENDER_OPTIONS,
  MARITAL_OPTIONS,
  PAYMENT_OPTION_COPY,
  PAYMENT_OPTIONS,
  SAVINGS_FREQUENCY_OPTIONS,
  membershipApplicationSchema,
  type MembershipApplicationValues,
  type MembershipFormValues,
  type PaymentOption,
} from "@/domains/membership/schema";
import type {
  CreatedMembershipApplication,
  MembershipChannelConfig,
} from "@/domains/membership/types";
import { PAYMENT_STATE_LABELS } from "@/domains/membership/types";

/**
 * Public membership registration — the website's entry point into the EXISTING
 * GIWESA membership application process.
 *
 * Nothing here creates an account, asks for a password or talks to a membership
 * database: the form validates what the visitor typed, sends it (with the
 * documents) to the GIWESA membership system through this site's own server, and
 * then reports the application reference and the payment position that system
 * returned.
 *
 * ## Reliability choices
 *
 *   - The submission carries an idempotency key kept in `sessionStorage`, so a
 *     double click, a network retry or a page reload cannot create two
 *     applications.
 *   - The application is created and submitted BEFORE any payment is attempted, so
 *     a failed or abandoned M-Pesa prompt can never lose the application.
 *   - The confirmation (reference + token) is kept in `sessionStorage`, so a reload
 *     does not lose the applicant's reference.
 */

const IDEMPOTENCY_KEY = "giwesa.membership.submissionKey";
const RESULT_KEY = "giwesa.membership.result";
const MAX_FILE_BYTES = 5 * 1024 * 1024;

type ConfigState =
  | { phase: "loading" }
  | { phase: "ready"; config: MembershipChannelConfig }
  | { phase: "unavailable"; message: string };

interface StoredResult {
  application: CreatedMembershipApplication;
  config: MembershipChannelConfig;
  applicantName: string;
  feeLabel: string;
  /** The number the applicant asked the M-Pesa prompt to go to. */
  mpesaPhone: string;
  /** True when the submission flow already asked the FMS to send the push. */
  stkSent?: boolean;
  /** A message when that initial push could not be sent. */
  stkError?: string;
}

/** A `randomUUID` fallback for a browser that lacks it (non-secure origin). */
function newSubmissionKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `web-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function emptyValues(): MembershipFormValues {
  return {
    firstName: "",
    middleName: "",
    surname: "",
    nationalId: "",
    dateOfBirth: "",
    gender: "",
    maritalStatus: "",
    occupation: "",
    employerName: "",
    primaryPhone: "",
    alternativePhone: "",
    email: "",
    postalAddress: "",
    county: "",
    subCounty: "",
    ward: "",
    villageEstate: "",
    nextOfKinName: "",
    nextOfKinRelationship: "",
    nextOfKinPhone: "",
    nextOfKinPhysicalAddress: "",
    hasBusiness: false,
    businessName: "",
    businessType: "",
    businessLocation: "",
    yearsInOperation: "",
    savingsFrequency: "",
    expectedSavingsAmount: "",
    paymentOption: "STK_PUSH",
    mpesaPhone: "",
    consent: false as unknown as true,
    company: "",
    startedAt: 0,
  };
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function MembershipRegistrationForm() {
  const [configState, setConfigState] = useState<ConfigState>({ phase: "loading" });
  const [result, setResult] = useState<StoredResult | null>(null);
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [nationalIdFile, setNationalIdFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [supportingFile, setSupportingFile] = useState<File | null>(null);
  const [fileErrors, setFileErrors] = useState<{ nationalId?: string; photograph?: string }>({});
  const idempotencyKey = useRef<string>("");
  const topRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    control,
    formState: { errors },
  } = useForm<MembershipFormValues, unknown, MembershipApplicationValues>({
    resolver: zodResolver(membershipApplicationSchema),
    defaultValues: emptyValues(),
    mode: "onBlur",
  });

  // useWatch rather than watch(): it subscribes without returning a function
  // the React Compiler cannot memoize, and it keeps these values reactive.
  const paymentOption = useWatch({ control, name: "paymentOption" });
  const hasBusiness = useWatch({ control, name: "hasBusiness" });
  const currentValues = useWatch({ control }) as MembershipFormValues;

  // --- configuration (fee, PayBill, available options) --------------------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/membership/config", { cache: "no-store" });
        const payload = (await response.json().catch(() => null)) as
          | {
              ok?: boolean;
              configured?: boolean;
              config?: MembershipChannelConfig;
              error?: string;
            }
          | null;
        if (cancelled) return;
        if (!response.ok || !payload?.ok) {
          setConfigState({
            phase: "unavailable",
            message: payload?.error ?? "Online membership registration is not available right now.",
          });
          return;
        }
        if (!payload.configured || !payload.config) {
          setConfigState({
            phase: "unavailable",
            message:
              "Online membership registration is not available at the moment. Please contact the GIWESA office and we will help you register.",
          });
          return;
        }
        const availableOptions =
          (payload.config.stkEnabled ? 1 : 0) +
          (payload.config.manualEnabled ? 1 : 0) +
          (payload.config.payLaterEnabled ? 1 : 0);
        if (availableOptions === 0) {
          setConfigState({
            phase: "unavailable",
            message:
              "Online payment is not available at the moment, so membership applications cannot be completed online. Please contact the GIWESA office.",
          });
          return;
        }
        setConfigState({ phase: "ready", config: payload.config });
        // Default to the first option the deployment actually offers.
        const firstAvailable: PaymentOption = payload.config.stkEnabled
          ? "STK_PUSH"
          : payload.config.manualEnabled
            ? "MANUAL"
            : "PAY_LATER";
        setValue("paymentOption", firstAvailable, { shouldValidate: false });
      } catch {
        if (!cancelled) {
          setConfigState({
            phase: "unavailable",
            message:
              "We could not reach the membership service. Please check your connection and refresh the page.",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setValue]);

  // --- session-bound submission key + browser-only form timing -----------
  useEffect(() => {
    try {
      const existing = window.sessionStorage.getItem(IDEMPOTENCY_KEY);
      const key = existing && existing.length >= 8 ? existing : newSubmissionKey();
      window.sessionStorage.setItem(IDEMPOTENCY_KEY, key);
      idempotencyKey.current = key;

      const stored = window.sessionStorage.getItem(RESULT_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as StoredResult;
        if (parsed?.application?.applicationId && parsed?.application?.token) setResult(parsed);
      }
    } catch {
      idempotencyKey.current = newSubmissionKey();
    }
    setValue("startedAt", Date.now(), { shouldValidate: false, shouldDirty: false });
  }, [setValue]);

  const scrollToTop = useCallback(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const onSubmit = handleSubmit(
    async (values) => {
      setStatus("");
      setFileErrors({});
      const errors: { nationalId?: string; photograph?: string } = {};
      if (!nationalIdFile) errors.nationalId = "Upload a copy of your National ID or passport.";
      if (!photoFile) errors.photograph = "Upload a passport-size photograph of yourself.";
      if (Object.keys(errors).length > 0) {
        setFileErrors(errors);
        setStatus("Please upload both required documents before submitting.");
        scrollToTop();
        return;
      }
      for (const [label, file] of [
        ["National ID", nationalIdFile],
        ["photograph", photoFile],
        ["supporting document", supportingFile],
      ] as const) {
        if (file && file.size > MAX_FILE_BYTES) {
          setStatus(`The ${label} is larger than 5 MB. Please choose a smaller file.`);
          return;
        }
      }

      setSubmitting(true);
      try {
        const form = new FormData();
        form.set(
          "payload",
          JSON.stringify({ ...values, startedAt: values.startedAt || Date.now() }),
        );
        form.set("nationalId", nationalIdFile as File);
        form.set("photograph", photoFile as File);
        if (supportingFile) form.set("supporting", supportingFile);
        form.set("idempotencyKey", idempotencyKey.current);

        const response = await fetch("/api/membership/applications", {
          method: "POST",
          body: form,
        });
        const payload = (await response.json().catch(() => null)) as
          | {
              ok?: boolean;
              error?: string;
              fields?: Record<string, string[]>;
              application?: CreatedMembershipApplication;
            }
          | null;

        if (!response.ok || !payload?.ok || !payload.application) {
          if (payload?.fields) {
            for (const [field, messages] of Object.entries(payload.fields)) {
              if (!messages[0]) continue;
              if (field === "nationalId") {
                setFileErrors((current) => ({ ...current, nationalId: messages[0] }));
              } else if (field === "photograph") {
                setFileErrors((current) => ({ ...current, photograph: messages[0] }));
              } else {
                setError(field as keyof MembershipFormValues, {
                  type: "server",
                  message: messages[0],
                });
              }
            }
          }
          setStatus(payload?.error ?? "Your application could not be submitted. Please try again.");
          scrollToTop();
          return;
        }

        const stored: StoredResult = {
          application: payload.application,
          config: configState.phase === "ready" ? configState.config : ({} as MembershipChannelConfig),
          applicantName: [values.firstName, values.middleName, values.surname]
            .map((part) => (part ?? "").trim())
            .filter(Boolean)
            .join(" "),
          feeLabel:
            configState.phase === "ready" ? configState.config.registrationFee.display : "",
          mpesaPhone: values.paymentOption === "STK_PUSH" ? values.mpesaPhone : "",
        };

        // For "pay now with M-Pesa", start the push as part of the submission, so
        // the prompt reaches the applicant's phone while they are still on this
        // screen. The application is ALREADY submitted at this point: a push that
        // cannot be sent is reported on the confirmation screen and never undoes
        // the application.
        if (
          payload.application.paymentOption === "STK_PUSH" &&
          stored.mpesaPhone.length > 0
        ) {
          try {
            const push = await fetch(
              `/api/membership/applications/${payload.application.applicationId}/stk`,
              {
                method: "POST",
                headers: {
                  "content-type": "application/json",
                  "x-membership-token": payload.application.token,
                },
                body: JSON.stringify({ phone: stored.mpesaPhone }),
              },
            );
            const pushBody = (await push.json().catch(() => null)) as
              | { ok?: boolean; error?: string }
              | null;
            if (push.ok && pushBody?.ok) {
              stored.stkSent = true;
              stored.application = {
                ...stored.application,
                paymentState: "PAYMENT_PENDING",
              };
            } else {
              stored.stkError =
                pushBody?.error ??
                "The M-Pesa request could not be sent. You can try again below or pay by PayBill.";
            }
          } catch {
            stored.stkError =
              "The M-Pesa request could not be sent. Check your connection and try again below.";
          }
        }

        setResult(stored);
        try {
          window.sessionStorage.setItem(RESULT_KEY, JSON.stringify(stored));
          window.sessionStorage.removeItem(IDEMPOTENCY_KEY);
        } catch {
          // Private browsing: the confirmation still renders in this tab.
        }
        scrollToTop();
      } catch {
        setStatus(
          "Your application could not be sent. Check your connection and press Submit again — nothing has been lost.",
        );
        scrollToTop();
      } finally {
        setSubmitting(false);
      }
    },
    () => {
      setStatus("Please check the highlighted fields and try again.");
      scrollToTop();
    },
  );

  if (result) {
    return (
      <MembershipConfirmation
        result={result}
        onStart={() => {
          setResult(null);
          try {
            window.sessionStorage.removeItem(RESULT_KEY);
            window.sessionStorage.removeItem(IDEMPOTENCY_KEY);
          } catch {
            /* ignore */
          }
          window.location.reload();
        }}
      />
    );
  }

  if (configState.phase === "loading") {
    return (
      <div className="rounded-2xl border border-line bg-white p-8 shadow-[var(--shadow-soft-value)]">
        <p className="flex items-center gap-2 text-sm text-ink-muted">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Loading the membership application form…
        </p>
      </div>
    );
  }

  if (configState.phase === "unavailable") {
    return (
      <div className="rounded-2xl border border-warning/40 bg-warning-soft p-7 sm:p-8" role="status">
        <AlertCircle className="size-6 text-warning" aria-hidden="true" />
        <h2 className="mt-3 font-display text-2xl text-brand-dark">
          Online registration is not available right now
        </h2>
        <p className="mt-3 text-sm leading-7 text-ink-muted">{configState.message}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Try again
          </Button>
          <Link
            href="/contact"
            className="inline-flex min-h-11 items-center rounded-full border border-brand bg-brand px-5 text-sm font-bold text-white hover:bg-brand-dark"
          >
            Contact GIWESA
          </Link>
        </div>
      </div>
    );
  }

  const config = configState.config;
  const options = PAYMENT_OPTIONS.filter((option) => {
    if (option === "STK_PUSH") return config.stkEnabled;
    if (option === "MANUAL") return config.manualEnabled;
    return config.payLaterEnabled;
  });
  const acceptAttribute = "image/jpeg,image/png,image/webp";

  return (
    <div ref={topRef} className="rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow-soft-value)] sm:p-8">
      <div className="border-b border-line pb-5">
        <p className="eyebrow">Membership application</p>
        <h2 className="mt-3 font-display text-3xl text-brand-dark">Join GIWESA</h2>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          No account is needed. Complete this form, upload your National ID copy and a
          passport-size photograph, then choose how to pay the one-off registration fee.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-muted">
          <span className="inline-flex items-center gap-1.5 font-bold text-brand-dark">
            <Wallet className="size-3.5" aria-hidden="true" />
            Registration fee {config.registrationFee.display}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" aria-hidden="true" />
            Takes about 10 minutes
          </span>
        </div>
      </div>

      {status ? (
        <div
          role="alert"
          className="mt-5 flex gap-3 rounded-xl border border-danger/30 bg-danger-soft p-4 text-sm font-semibold leading-6 text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{status}</span>
        </div>
      ) : null}

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-8">
        <p className="text-xs text-ink-muted">
          Fields marked <span className="font-bold text-danger">*</span> are required.
        </p>

        {/* ---- 1. Personal ------------------------------------------------ */}
        <Section number={1} title="Personal details" description="Exactly as it appears on your ID.">
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="First name" required error={errors.firstName?.message} htmlFor="m-first">
              <input id="m-first" className="field" autoComplete="given-name" {...register("firstName")} />
            </Field>
            <Field label="Middle name" error={errors.middleName?.message} htmlFor="m-middle">
              <input id="m-middle" className="field" autoComplete="additional-name" {...register("middleName")} />
            </Field>
            <Field label="Surname" required error={errors.surname?.message} htmlFor="m-surname">
              <input id="m-surname" className="field" autoComplete="family-name" {...register("surname")} />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="National ID / passport number"
              required
              error={errors.nationalId?.message}
              htmlFor="m-nid"
              hint="The number on the ID document you will upload below."
            >
              <input id="m-nid" className="field" inputMode="text" {...register("nationalId")} />
            </Field>
            <Field label="Date of birth" error={errors.dateOfBirth?.message} htmlFor="m-dob">
              <input id="m-dob" type="date" className="field" max={new Date().toISOString().slice(0, 10)} {...register("dateOfBirth")} />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Gender" error={errors.gender?.message} htmlFor="m-gender">
              <select id="m-gender" className="field" {...register("gender")}>
                <option value="">Prefer not to say</option>
                {GENDER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Marital status" error={errors.maritalStatus?.message} htmlFor="m-marital">
              <select id="m-marital" className="field" {...register("maritalStatus")}>
                <option value="">Prefer not to say</option>
                {MARITAL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Occupation" error={errors.occupation?.message} htmlFor="m-occupation">
              <input id="m-occupation" className="field" autoComplete="organization-title" {...register("occupation")} />
            </Field>
            <Field label="Employer" error={errors.employerName?.message} htmlFor="m-employer">
              <input id="m-employer" className="field" {...register("employerName")} />
            </Field>
          </div>
        </Section>

        {/* ---- 2. Contact & address -------------------------------------- */}
        <Section number={2} title="Contact and address" description="How we reach you about this application.">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Primary phone" required error={errors.primaryPhone?.message} htmlFor="m-phone">
              <input id="m-phone" type="tel" inputMode="tel" autoComplete="tel" className="field" placeholder="0712 345 678" {...register("primaryPhone")} />
            </Field>
            <Field label="Alternative phone" error={errors.alternativePhone?.message} htmlFor="m-alt-phone">
              <input id="m-alt-phone" type="tel" inputMode="tel" className="field" {...register("alternativePhone")} />
            </Field>
          </div>
          <Field
            label="Email address"
            required
            error={errors.email?.message}
            htmlFor="m-email"
            hint="Your confirmation and reference number are sent here."
          >
            <input id="m-email" type="email" autoComplete="email" className="field" placeholder="you@example.com" {...register("email")} />
          </Field>
          <Field label="Postal address" error={errors.postalAddress?.message} htmlFor="m-postal">
            <input id="m-postal" className="field" autoComplete="street-address" {...register("postalAddress")} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="County" error={errors.county?.message} htmlFor="m-county">
              <input id="m-county" className="field" autoComplete="address-level1" {...register("county")} />
            </Field>
            <Field label="Sub-county" error={errors.subCounty?.message} htmlFor="m-subcounty">
              <input id="m-subcounty" className="field" autoComplete="address-level2" {...register("subCounty")} />
            </Field>
            <Field label="Ward" error={errors.ward?.message} htmlFor="m-ward">
              <input id="m-ward" className="field" {...register("ward")} />
            </Field>
            <Field label="Village / estate" error={errors.villageEstate?.message} htmlFor="m-village">
              <input id="m-village" className="field" {...register("villageEstate")} />
            </Field>
          </div>
        </Section>

        {/* ---- 3. Next of kin -------------------------------------------- */}
        <Section number={3} title="Next of kin" description="Someone we can contact in an emergency." optional>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name" error={errors.nextOfKinName?.message} htmlFor="m-nok-name">
              <input id="m-nok-name" className="field" {...register("nextOfKinName")} />
            </Field>
            <Field label="Relationship" error={errors.nextOfKinRelationship?.message} htmlFor="m-nok-rel">
              <input id="m-nok-rel" className="field" placeholder="e.g. Spouse" {...register("nextOfKinRelationship")} />
            </Field>
            <Field label="Phone" error={errors.nextOfKinPhone?.message} htmlFor="m-nok-phone">
              <input id="m-nok-phone" type="tel" inputMode="tel" className="field" {...register("nextOfKinPhone")} />
            </Field>
            <Field label="Physical address" error={errors.nextOfKinPhysicalAddress?.message} htmlFor="m-nok-address">
              <input id="m-nok-address" className="field" {...register("nextOfKinPhysicalAddress")} />
            </Field>
          </div>
        </Section>

        {/* ---- 4. Business ----------------------------------------------- */}
        <Section number={4} title="Business or enterprise" description="Only if you run a business or trade." optional>
          <div className="flex items-start gap-3 rounded-xl border border-line bg-canvas p-4">
            <input id="m-has-business" type="checkbox" className="mt-0.5 size-4 shrink-0 accent-[var(--brand-primary)]" {...register("hasBusiness")} />
            <label htmlFor="m-has-business" className="text-sm leading-6 text-ink">
              I run a business or trade of my own
            </label>
          </div>
          {hasBusiness ? (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Business name" required error={errors.businessName?.message} htmlFor="m-biz-name">
                  <input id="m-biz-name" className="field" {...register("businessName")} />
                </Field>
                <Field label="Business type" error={errors.businessType?.message} htmlFor="m-biz-type">
                  <input id="m-biz-type" className="field" placeholder="e.g. Retail shop" {...register("businessType")} />
                </Field>
                <Field label="Location" error={errors.businessLocation?.message} htmlFor="m-biz-location">
                  <input id="m-biz-location" className="field" {...register("businessLocation")} />
                </Field>
                <Field label="Years in operation" error={errors.yearsInOperation?.message} htmlFor="m-biz-years">
                  <input id="m-biz-years" className="field" inputMode="numeric" {...register("yearsInOperation")} />
                </Field>
              </div>
            </>
          ) : null}
        </Section>

        {/* ---- 5. Savings ------------------------------------------------ */}
        <Section number={5} title="Savings intention" description="How you would like to save with GIWESA." optional>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Savings frequency" error={errors.savingsFrequency?.message} htmlFor="m-frequency">
              <select id="m-frequency" className="field" {...register("savingsFrequency")}>
                <option value="">Not sure yet</option>
                {SAVINGS_FREQUENCY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Expected contribution (KES)" error={errors.expectedSavingsAmount?.message} htmlFor="m-savings">
              <input id="m-savings" className="field" inputMode="decimal" placeholder="e.g. 1000" {...register("expectedSavingsAmount")} />
            </Field>
          </div>
        </Section>

        {/* ---- 6. Documents ---------------------------------------------- */}
        <Section
          number={6}
          title="Documents"
          description="Both documents are required for an online application. Your files are stored privately and seen only by authorised GIWESA staff."
        >
          <DocumentPicker
            id="m-national-id"
            label="National ID / passport copy"
            hint="A clear photo or scan of the front of your ID. JPEG, PNG or WebP, up to 5 MB."
            required
            accept={acceptAttribute}
            file={nationalIdFile}
            error={fileErrors.nationalId}
            onChange={(file) => {
              setNationalIdFile(file);
              setFileErrors((current) => ({ ...current, nationalId: undefined }));
            }}
          />
          <DocumentPicker
            id="m-photograph"
            label="Passport-size photograph"
            hint="A recent photo of your face, plain background. JPEG, PNG or WebP, up to 5 MB."
            required
            accept={acceptAttribute}
            file={photoFile}
            error={fileErrors.photograph}
            preview
            onChange={(file) => {
              setPhotoFile(file);
              setFileErrors((current) => ({ ...current, photograph: undefined }));
            }}
          />
          <DocumentPicker
            id="m-supporting"
            label="Supporting document"
            hint="Optional. For example a business permit. Images or a PDF, up to 5 MB."
            accept={`${acceptAttribute},application/pdf`}
            file={supportingFile}
            onChange={setSupportingFile}
          />
        </Section>

        {/* ---- 7. Payment ------------------------------------------------ */}
        <Section
          number={7}
          title="Registration fee"
          description={`The one-off registration fee is ${config.registrationFee.display}. Choose how you would like to pay it.`}
        >
          <fieldset>
            <legend className="sr-only">How would you like to pay?</legend>
            <div className="grid gap-3">
              {options.map((option) => {
                const copy = PAYMENT_OPTION_COPY[option];
                const selected = paymentOption === option;
                return (
                  <label
                    key={option}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                      selected ? "border-brand bg-brand-light" : "border-line bg-white hover:border-line-strong"
                    }`}
                  >
                    <input
                      type="radio"
                      value={option}
                      className="mt-1 size-4 shrink-0 accent-[var(--brand-primary)]"
                      {...register("paymentOption")}
                    />
                    <span>
                      <span className="block text-sm font-bold text-brand-dark">{copy.title}</span>
                      <span className="mt-1 block text-xs leading-5 text-ink-muted">
                        {copy.description}
                      </span>
                      {option === "MANUAL" && config.paybill ? (
                        <span className="mt-1 block text-xs font-semibold text-ink">
                          PayBill {config.paybill} · reference generated after submission
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
            </div>
            {errors.paymentOption ? (
              <p className="field-error" role="alert">
                {errors.paymentOption.message}
              </p>
            ) : null}
          </fieldset>

          {paymentOption === "STK_PUSH" ? (
            <Field
              label="M-Pesa phone number"
              required
              error={errors.mpesaPhone?.message}
              htmlFor="m-mpesa-phone"
              hint="The number that will receive the M-Pesa payment request. Use 07XXXXXXXX or +2547XXXXXXXX."
            >
              <input id="m-mpesa-phone" type="tel" inputMode="tel" className="field" placeholder="0712 345 678" {...register("mpesaPhone")} />
            </Field>
          ) : null}

          {paymentOption === "PAY_LATER" ? (
            <p className="rounded-xl border border-warning/40 bg-warning-soft p-4 text-xs leading-5 text-warning">
              <strong>Please note:</strong> your application is submitted immediately, but the{" "}
              {config.registrationFee.display} registration fee stays outstanding. Membership cannot
              be activated until it is paid. You can settle it later with the PayBill details we send
              you.
            </p>
          ) : null}
        </Section>

        {/* ---- 8. Review & declaration ----------------------------------- */}
        <Section number={8} title="Review and submit" description="Check your details, then accept the declaration.">
          <ReviewSummary
            values={currentValues}
            fee={config.registrationFee.display}
            documents={{
              nationalId: nationalIdFile?.name ?? null,
              photograph: photoFile?.name ?? null,
              supporting: supportingFile?.name ?? null,
            }}
          />

          <div className="rounded-xl border border-line bg-canvas p-4">
            <div className="flex items-start gap-3">
              <input
                id="m-consent"
                type="checkbox"
                className="mt-0.5 size-4 shrink-0 accent-[var(--brand-primary)]"
                aria-invalid={errors.consent ? true : undefined}
                {...register("consent")}
              />
              <label htmlFor="m-consent" className="text-xs leading-5 text-ink-muted">
                I confirm that the information in this application is true and complete, and I
                authorise GIWESA to verify it, keep it as part of my membership record and contact me
                about this application. I have read the{" "}
                <Link href="/privacy" className="font-bold text-brand underline underline-offset-2">
                  privacy notice
                </Link>{" "}
                and the{" "}
                <Link href="/terms" className="font-bold text-brand underline underline-offset-2">
                  website terms
                </Link>
                . <span className="text-danger">*</span>
              </label>
            </div>
            {errors.consent ? (
              <p className="field-error" role="alert">
                {errors.consent.message}
              </p>
            ) : null}
          </div>
        </Section>

        <div
          className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
          aria-hidden="true"
        >
          <label htmlFor="m-company">Company</label>
          <input id="m-company" type="text" tabIndex={-1} autoComplete="off" {...register("company")} />
        </div>

        <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-sm text-[0.6875rem] leading-5 text-ink-muted">
            Your application is not a membership until it has been reviewed and approved by GIWESA.
            We will email you when its status changes.
          </p>
          <Button type="submit" disabled={submitting} size="lg" className="min-w-56 justify-between">
            {submitting ? (
              <>
                Submitting application
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              </>
            ) : (
              <>
                Submit application
                <Send className="size-4" aria-hidden="true" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/* Layout helpers                                                            */
/* ------------------------------------------------------------------------- */

function Section({
  number,
  title,
  description,
  optional,
  children,
}: {
  number: number;
  title: string;
  description: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={`section-${number}`} className="space-y-4 border-t border-line pt-7 first:border-0 first:pt-0">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 id={`section-${number}`} className="flex items-baseline gap-2.5">
            <span className="font-mono text-xs font-bold text-sun">0{number}</span>
            <span className="font-display text-2xl text-brand-dark">{title}</span>
          </h3>
          <p className="mt-1 text-sm leading-6 text-ink-muted">{description}</p>
        </div>
        {optional ? (
          <span className="shrink-0 rounded-full border border-line px-2.5 py-1 text-[0.625rem] font-bold uppercase tracking-wider text-ink-muted">
            Optional
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  required,
  error,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="field-label">
        {label}
        {required ? (
          <span className="text-danger" aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="field-hint">{hint}</p>
      ) : null}
    </div>
  );
}

function DocumentPicker({
  id,
  label,
  hint,
  required,
  accept,
  file,
  error,
  preview,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  required?: boolean;
  accept: string;
  file: File | null;
  error?: string;
  preview?: boolean;
  onChange: (file: File | null) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
        {required ? (
          <span className="text-danger" aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <label
          htmlFor={id}
          className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-5 text-sm font-bold transition-colors ${
            error
              ? "border-danger bg-danger-soft text-danger"
              : file
                ? "border-leaf-dark bg-leaf-light text-leaf-dark"
                : "border-line-strong bg-white text-ink hover:border-brand"
          }`}
        >
          {file ? (
            <CheckCircle2 className="size-4" aria-hidden="true" />
          ) : (
            <Upload className="size-4" aria-hidden="true" />
          )}
          {file ? "Choose a different file" : "Choose file"}
        </label>
        <span className="min-w-0 text-xs text-ink-muted">
          {file ? `${file.name} · ${formatBytes(file.size)}` : "No file chosen"}
        </span>
        <input
          id={id}
          type="file"
          accept={accept}
          className="sr-only"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : `${id}-hint`}
          onChange={(event) => {
            const selected = event.target.files?.[0] ?? null;
            onChange(selected);
          }}
        />
        {preview && file ? (
          // The object URL is created once per selected file and revoked when the
          // preview unmounts; `key` remounts it when a different file is chosen.
          <FilePreview key={`${file.name}:${file.size}:${file.lastModified}`} file={file} />
        ) : null}
      </div>
      {error ? (
        <p id={`${id}-error`} className="field-error" role="alert">
          {error}
        </p>
      ) : (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      )}
    </div>
  );
}

/**
 * The thumbnail for a chosen image.
 *
 * The object URL is created once in a lazy state initializer (not in an effect)
 * and revoked on unmount; the parent remounts this component with a `key` when a
 * different file is chosen, so no stale URL is ever displayed.
 */
function FilePreview({ file }: { file: File }) {
  const [url] = useState(() => URL.createObjectURL(file));
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a local object URL, not an optimizable asset
    <img
      src={url}
      alt="Preview of the selected photograph"
      className="size-16 rounded-lg border border-line object-cover"
    />
  );
}

function ReviewSummary({
  values,
  fee,
  documents,
}: {
  values: MembershipFormValues;
  fee: string;
  documents: { nationalId: string | null; photograph: string | null; supporting: string | null };
}) {
  const name = [values.firstName, values.middleName, values.surname]
    .map((part) => (part ?? "").trim())
    .filter(Boolean)
    .join(" ");
  const paymentLabel = PAYMENT_OPTION_COPY[values.paymentOption]?.title ?? values.paymentOption;

  const rows: Array<{ label: string; value: string }> = [
    { label: "Applicant", value: name || "—" },
    { label: "National ID / passport", value: values.nationalId || "—" },
    { label: "Primary phone", value: values.primaryPhone || "—" },
    { label: "Email", value: values.email || "—" },
    {
      label: "County / sub-county",
      value: [values.county, values.subCounty].filter(Boolean).join(" / ") || "—",
    },
    { label: "Registration fee", value: fee },
    { label: "Payment option", value: paymentLabel },
    { label: "National ID copy", value: documents.nationalId ?? "Not attached yet" },
    { label: "Photograph", value: documents.photograph ?? "Not attached yet" },
  ];
  if (documents.supporting) rows.push({ label: "Supporting document", value: documents.supporting });

  return (
    <div className="rounded-xl border border-line bg-canvas p-4">
      <p className="text-[0.625rem] font-bold uppercase tracking-[0.18em] text-ink-muted">
        Your application at a glance
      </p>
      <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-wrap justify-between gap-2 text-xs">
            <dt className="text-ink-muted">{row.label}</dt>
            <dd className="max-w-[60%] truncate text-right font-semibold text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/* Confirmation + payment                                                   */
/* ------------------------------------------------------------------------- */

function MembershipConfirmation({
  result,
  onStart,
}: {
  result: StoredResult;
  onStart: () => void;
}) {
  const [application, setApplication] = useState(result.application);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [paymentError, setPaymentError] = useState(result.stkError ?? "");
  const [mpesaCode, setMpesaCode] = useState("");
  const [codeBusy, setCodeBusy] = useState(false);
  const [codeError, setCodeError] = useState("");
  // The submission flow starts the push for an STK application, so the request
  // has normally already been sent by the time this screen renders.  A failure
  // there is shown here and can be retried; the application is unaffected.
  const [stkSent, setStkSent] = useState(result.stkSent === true);

  const fee = application.fee;
  const paid = fee.satisfied || application.paymentState === "PAID";
  const pending = application.paymentState === "PAYMENT_PENDING";
  const awaitingVerification = application.paymentState === "AWAITING_MANUAL_VERIFICATION";
  const token = application.token;
  const applicationId = application.applicationId;

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/membership/applications/${applicationId}/status`, {
        headers: { "x-membership-token": token },
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; application?: { paymentState: string; status: string; fee: typeof fee } }
        | null;
      if (response.ok && payload?.ok && payload.application) {
        setApplication((current) => ({
          ...current,
          paymentState: payload.application!.paymentState,
          status: payload.application!.status,
          fee: payload.application!.fee,
        }));
      }
    } catch {
      // A polling failure is not an error the applicant must act on.
    }
  }, [applicationId, token]);

  // While an M-Pesa request is outstanding, keep the confirmation screen current:
  // the provider answers the FMS's callback, not this browser. The interval is an
  // external subscription, which is exactly what an effect is for.
  useEffect(() => {
    if (!pending) return;
    const timer = window.setInterval(refresh, 4000);
    return () => window.clearInterval(timer);
  }, [pending, refresh]);

  const startStk = useCallback(async () => {
    setPaymentError("");
    if (!result.mpesaPhone) {
      setPaymentError(
        "We do not have an M-Pesa number for this application. Please contact the GIWESA office.",
      );
      return;
    }
    setPaymentBusy(true);
    try {
      const response = await fetch(`/api/membership/applications/${applicationId}/stk`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-membership-token": token },
        body: JSON.stringify({ phone: result.mpesaPhone }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; payment?: { message: string } }
        | null;
      if (!response.ok || !payload?.ok) {
        setPaymentError(payload?.error ?? "The payment request could not be sent.");
        return;
      }
      setStkSent(true);
      setApplication((current) => ({ ...current, paymentState: "PAYMENT_PENDING" }));
      void refresh();
    } catch {
      setPaymentError("The payment request could not be sent. Check your connection and try again.");
    } finally {
      setPaymentBusy(false);
    }
  }, [applicationId, token, refresh, result.mpesaPhone]);

  async function submitCode() {
    setCodeError("");
    setCodeBusy(true);
    try {
      const response = await fetch(
        `/api/membership/applications/${applicationId}/manual-payment`,
        {
          method: "POST",
          headers: { "content-type": "application/json", "x-membership-token": token },
          body: JSON.stringify({ mpesaCode }),
        },
      );
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; application?: { paymentState: string; status: string; fee: typeof fee } }
        | null;
      if (!response.ok || !payload?.ok) {
        setCodeError(payload?.error ?? "The payment code could not be recorded.");
        return;
      }
      if (payload.application) {
        setApplication((current) => ({
          ...current,
          paymentState: payload.application!.paymentState,
          status: payload.application!.status,
          fee: payload.application!.fee,
        }));
      }
      setMpesaCode("");
    } catch {
      setCodeError("The payment code could not be recorded. Check your connection and try again.");
    } finally {
      setCodeBusy(false);
    }
  }

  const paybill = result.config?.paybill ?? null;
  const feeLabel = result.config?.registrationFee?.display ?? (result.feeLabel || "the registration fee");

  return (
    <div className="rounded-2xl border border-leaf/30 bg-white p-5 shadow-[var(--shadow-soft-value)] sm:p-8">
      <div className="flex items-start gap-4">
        <span className="mt-0.5 inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-leaf-light text-leaf-dark">
          <CheckCircle2 className="size-6" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-3xl text-brand-dark">Application received</h2>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            Thank you{result.applicantName ? `, ${result.applicantName.split(" ")[0]}` : ""}. Your
            membership application has been submitted and is now awaiting review and approval. A
            confirmation email is on its way to you.
          </p>
        </div>
      </div>

      <dl className="mt-6 grid gap-3 rounded-xl border border-line bg-canvas p-4 sm:grid-cols-3">
        <div>
          <dt className="text-[0.625rem] font-bold uppercase tracking-[0.15em] text-ink-muted">
            Application reference
          </dt>
          <dd className="mt-1 font-mono text-sm font-bold text-brand-dark">
            {application.applicationNumber}
          </dd>
        </div>
        <div>
          <dt className="text-[0.625rem] font-bold uppercase tracking-[0.15em] text-ink-muted">
            Payment reference
          </dt>
          <dd className="mt-1 font-mono text-sm font-bold text-brand-dark">
            {application.paymentReference || `${application.applicationNumber}-REG`}
          </dd>
        </div>
        <div>
          <dt className="text-[0.625rem] font-bold uppercase tracking-[0.15em] text-ink-muted">
            Registration fee
          </dt>
          <dd className="mt-1 text-sm font-bold text-brand-dark">{feeLabel}</dd>
        </div>
      </dl>

      {/* ---- payment ---------------------------------------------------- */}
      <div className="mt-6 rounded-xl border border-line p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-brand-dark">Registration fee</h3>
          <span
            className={`rounded-full px-3 py-1 text-[0.6875rem] font-bold ${
              paid
                ? "bg-leaf-light text-leaf-dark"
                : awaitingVerification
                  ? "bg-brand-light text-brand"
                  : "bg-warning-soft text-warning"
            }`}
          >
            {paid ? "Paid" : PAYMENT_STATE_LABELS[application.paymentState] ?? application.paymentState}
          </span>
        </div>

        {paid ? (
          <p className="mt-3 text-sm leading-6 text-ink-muted">
            We have confirmed your {feeLabel} registration fee. There is nothing more to pay.
          </p>
        ) : awaitingVerification ? (
          <div className="mt-3 text-sm leading-6 text-ink-muted">
            <p>
              Thank you — we have recorded your M-Pesa transaction code. Our finance team will verify
              it against the GIWESA account. This does not delay the review of your application.
            </p>
            {application.paymentState === "AWAITING_MANUAL_VERIFICATION" ? (
              <p className="mt-2 text-xs">
                If you entered the code incorrectly, contact the office so we can trace the payment.
              </p>
            ) : null}
          </div>
        ) : application.paymentOption === "STK_PUSH" ? (
          <div className="mt-3 space-y-3">
            <p className="text-sm leading-6 text-ink-muted">
              {stkSent || pending
                ? "An M-Pesa payment request has been sent to your phone. Enter your M-Pesa PIN to complete it. This page updates automatically."
                : `We will send an M-Pesa payment request for ${feeLabel} to the number you provided.`}
            </p>
            {pending ? (
              <p className="flex items-center gap-2 text-xs text-ink-muted">
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                Waiting for M-Pesa to confirm your payment…
              </p>
            ) : null}
            {paymentError ? (
              <p className="field-error" role="alert">
                {paymentError}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => void startStk()}
                disabled={paymentBusy}
              >
                {paymentBusy ? (
                  <>
                    Sending <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  </>
                ) : stkSent || pending ? (
                  "Send the request again"
                ) : (
                  "Send the M-Pesa request"
                )}
              </Button>
              <Button type="button" variant="ghost" onClick={() => void refresh()}>
                Check payment status
              </Button>
            </div>
            <PaymentInstructions paybill={paybill} reference={application.paymentReference} feeLabel={feeLabel} />
          </div>
        ) : application.paymentOption === "MANUAL" ? (
          <div className="mt-3 space-y-4">
            <PaymentInstructions paybill={paybill} reference={application.paymentReference} feeLabel={feeLabel} />
            <div>
              <label htmlFor="m-manual-code" className="field-label">
                Already paid? Enter the M-Pesa transaction code
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  id="m-manual-code"
                  className="field max-w-56"
                  placeholder="e.g. QK12ABC34X"
                  value={mpesaCode}
                  onChange={(event) => setMpesaCode(event.target.value.toUpperCase())}
                  autoComplete="off"
                  spellCheck={false}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void submitCode()}
                  disabled={codeBusy || mpesaCode.trim().length < 6}
                >
                  {codeBusy ? "Saving…" : "Save payment code"}
                </Button>
              </div>
              {codeError ? (
                <p className="field-error" role="alert">
                  {codeError}
                </p>
              ) : (
                <p className="field-hint">
                  This is a claim for our finance team to verify; it does not mark the fee as paid
                  automatically.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-3 space-y-4">
            <p className="text-sm leading-6 text-ink-muted">
              You chose to pay later. Your application will be reviewed while the fee remains
              outstanding, but membership cannot be activated until it is paid. You can settle it at
              any time using the details below, quoting your payment reference.
            </p>
            <PaymentInstructions paybill={paybill} reference={application.paymentReference} feeLabel={feeLabel} />
          </div>
        )}
      </div>

      {/* ---- next steps -------------------------------------------------- */}
      <div className="mt-6">
        <h3 className="text-sm font-bold text-brand-dark">What happens next</h3>
        <ol className="mt-3 space-y-2.5">
          {[
            "We review your application and the documents you uploaded.",
            "If anything needs correcting, we contact you using the phone number or email you gave us.",
            "Once approved, we email you your membership number and the steps to activate your membership.",
          ].map((step, index) => (
            <li key={step} className="flex gap-3 text-sm leading-6 text-ink-muted">
              <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-canvas text-[0.625rem] font-bold text-brand-dark">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-5">
        <Button type="button" variant="secondary" onClick={onStart}>
          Start another application
        </Button>
        <Link href="/contact" className="text-sm font-bold text-brand">
          <span className="link-underline">Contact GIWESA</span>
        </Link>
        <span className="text-xs text-ink-muted">
          Quote reference {application.applicationNumber} when you contact us.
        </span>
      </div>
    </div>
  );
}

function PaymentInstructions({
  paybill,
  reference,
  feeLabel,
}: {
  paybill: string | null;
  reference: string;
  feeLabel: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-canvas p-4">
      <p className="text-[0.625rem] font-bold uppercase tracking-[0.15em] text-ink-muted">
        Pay by M-Pesa PayBill
      </p>
      <ol className="mt-2 space-y-1.5 text-sm leading-6 text-ink">
        <li>
          Go to <strong>M-Pesa → Lipa na M-Pesa → Pay Bill</strong>.
        </li>
        <li>
          Business number:{" "}
          <strong className="font-mono">{paybill ?? "ask the GIWESA office"}</strong>
        </li>
        <li>
          Account number: <strong className="font-mono">{reference}</strong>
        </li>
        <li>
          Amount: <strong>{feeLabel}</strong>
        </li>
        <li>Enter your M-Pesa PIN and confirm.</li>
      </ol>
      <p className="mt-2 text-xs leading-5 text-ink-muted">
        Use the reference exactly as shown so the payment reaches your application. Keep the M-Pesa
        confirmation SMS.
      </p>
    </div>
  );
}
