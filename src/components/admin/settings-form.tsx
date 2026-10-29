"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Save } from "lucide-react";

import { saveSettingsAction } from "@/app/admin/(dashboard)/settings/actions";
import { INITIAL_ACTION_STATE, type ActionState } from "@/lib/action-state";

type SettingsValues = {
  phone: string;
  email: string;
  address: string;
  officeHours: string;
  facebookUrl: string;
  instagramUrl: string;
  linkedinUrl: string;
  xUrl: string;
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
};

function errorFor(state: ActionState, key: string) {
  return state.fields?.[key]?.[0];
}

export function SettingsForm({ initial }: { initial: SettingsValues }) {
  const [state, action, pending] = useActionState(saveSettingsAction, INITIAL_ACTION_STATE);

  return (
    <form action={action} className="space-y-5">
      {state.status === "error" ? (
        <div
          role="alert"
          className="flex gap-3 rounded-xl border border-danger/30 bg-danger-soft p-4 text-xs font-semibold leading-5 text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{state.message}</span>
        </div>
      ) : null}
      {state.status === "success" ? (
        <div
          role="status"
          className="flex gap-3 rounded-xl border border-[#b9d8c3] bg-[#eef8f1] p-4 text-xs font-semibold leading-5 text-[#2e6b45]"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{state.message}</span>
        </div>
      ) : null}

      <section className="admin-card p-5 sm:p-6">
        <h2 className="text-sm font-bold text-brand-dark">Public contact details</h2>
        <p className="mt-1 text-xs leading-5 text-ink-muted">
          These values appear in the header, footer and contact page. Only add details that are
          genuinely monitored by GIWESA.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="settings-phone" className="field-label">
              Public phone
            </label>
            <input
              id="settings-phone"
              name="phone"
              type="tel"
              defaultValue={initial.phone}
              className="field"
              aria-invalid={errorFor(state, "phone") ? true : undefined}
            />
            {errorFor(state, "phone") ? (
              <p className="field-error" role="alert">
                {errorFor(state, "phone")}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor="settings-email" className="field-label">
              Public email
            </label>
            <input
              id="settings-email"
              name="email"
              type="email"
              defaultValue={initial.email}
              className="field"
              aria-invalid={errorFor(state, "email") ? true : undefined}
            />
            {errorFor(state, "email") ? (
              <p className="field-error" role="alert">
                {errorFor(state, "email")}
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-4">
          <label htmlFor="settings-address" className="field-label">
            Office address
          </label>
          <textarea
            id="settings-address"
            name="address"
            rows={3}
            defaultValue={initial.address}
            className="field resize-y"
            aria-invalid={errorFor(state, "address") ? true : undefined}
          />
          {errorFor(state, "address") ? (
            <p className="field-error" role="alert">
              {errorFor(state, "address")}
            </p>
          ) : null}
        </div>
        <div className="mt-4">
          <label htmlFor="settings-hours" className="field-label">
            Office hours <span className="font-medium text-ink-muted">(optional)</span>
          </label>
          <input
            id="settings-hours"
            name="officeHours"
            type="text"
            defaultValue={initial.officeHours}
            className="field"
            placeholder="Only add if confirmed"
          />
        </div>
      </section>

      <section className="admin-card p-5 sm:p-6">
        <h2 className="text-sm font-bold text-brand-dark">Social links</h2>
        <p className="mt-1 text-xs leading-5 text-ink-muted">
          Leave blank to hide the icon. Only add profiles that belong to GIWESA.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {[
            { name: "facebookUrl", label: "Facebook URL", value: initial.facebookUrl },
            { name: "instagramUrl", label: "Instagram URL", value: initial.instagramUrl },
            { name: "linkedinUrl", label: "LinkedIn URL", value: initial.linkedinUrl },
            { name: "xUrl", label: "X URL", value: initial.xUrl },
          ].map((field) => (
            <div key={field.name}>
              <label htmlFor={`settings-${field.name}`} className="field-label">
                {field.label}
              </label>
              <input
                id={`settings-${field.name}`}
                name={field.name}
                type="url"
                defaultValue={field.value}
                className="field"
                placeholder="https://"
                aria-invalid={errorFor(state, field.name) ? true : undefined}
              />
              {errorFor(state, field.name) ? (
                <p className="field-error" role="alert">
                  {errorFor(state, field.name)}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="admin-card p-5 sm:p-6">
        <h2 className="text-sm font-bold text-brand-dark">Homepage hero</h2>
        <p className="mt-1 text-xs leading-5 text-ink-muted">
          Keep the heading specific and avoid unsupported financial claims.
        </p>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="settings-eyebrow" className="field-label">
              Eyebrow
            </label>
            <input
              id="settings-eyebrow"
              name="heroEyebrow"
              type="text"
              defaultValue={initial.heroEyebrow}
              className="field"
              maxLength={80}
            />
            {errorFor(state, "heroEyebrow") ? (
              <p className="field-error" role="alert">
                {errorFor(state, "heroEyebrow")}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor="settings-title" className="field-label">
              Heading
            </label>
            <input
              id="settings-title"
              name="heroTitle"
              type="text"
              defaultValue={initial.heroTitle}
              className="field"
              maxLength={180}
            />
            {errorFor(state, "heroTitle") ? (
              <p className="field-error" role="alert">
                {errorFor(state, "heroTitle")}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor="settings-description" className="field-label">
              Supporting text
            </label>
            <textarea
              id="settings-description"
              name="heroDescription"
              rows={4}
              defaultValue={initial.heroDescription}
              className="field resize-y"
              maxLength={500}
            />
            {errorFor(state, "heroDescription") ? (
              <p className="field-error" role="alert">
                {errorFor(state, "heroDescription")}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand px-5 text-xs font-bold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Save className="size-4" aria-hidden="true" />
        )}
        Save website settings
      </button>
    </form>
  );
}
