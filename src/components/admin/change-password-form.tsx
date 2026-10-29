"use client";

import { useActionState } from "react";
import { AlertCircle, KeyRound, Loader2 } from "lucide-react";

import { changePasswordAction } from "@/app/admin/(dashboard)/settings/actions";
import { INITIAL_ACTION_STATE, type ActionState } from "@/lib/action-state";

function errorFor(state: ActionState, key: string) {
  return state.fields?.[key]?.[0];
}

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, INITIAL_ACTION_STATE);

  return (
    <form action={action} className="admin-card p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="inline-flex size-10 items-center justify-center rounded-full bg-brand-light text-brand">
          <KeyRound className="size-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-sm font-bold text-brand-dark">Change password</h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            All existing sessions are signed out after a change.
          </p>
        </div>
      </div>

      {state.status === "error" ? (
        <div
          role="alert"
          className="mt-4 flex gap-3 rounded-lg border border-danger/30 bg-danger-soft p-3 text-xs font-semibold leading-5 text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{state.message}</span>
        </div>
      ) : null}

      <div className="mt-5 space-y-4">
        <div>
          <label htmlFor="current-password" className="field-label">
            Current password
          </label>
          <input
            id="current-password"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            className="field"
            aria-invalid={errorFor(state, "currentPassword") ? true : undefined}
          />
          {errorFor(state, "currentPassword") ? (
            <p className="field-error" role="alert">
              {errorFor(state, "currentPassword")}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="new-password" className="field-label">
            New password
          </label>
          <input
            id="new-password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            className="field"
            aria-describedby="new-password-hint"
            aria-invalid={errorFor(state, "newPassword") ? true : undefined}
          />
          <p id="new-password-hint" className="field-hint">
            At least 12 characters, including a letter and a number.
          </p>
          {errorFor(state, "newPassword") ? (
            <p className="field-error" role="alert">
              {errorFor(state, "newPassword")}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="confirm-password" className="field-label">
            Confirm new password
          </label>
          <input
            id="confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            className="field"
            aria-invalid={errorFor(state, "confirmPassword") ? true : undefined}
          />
          {errorFor(state, "confirmPassword") ? (
            <p className="field-error" role="alert">
              {errorFor(state, "confirmPassword")}
            </p>
          ) : null}
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-brand px-5 text-xs font-bold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <KeyRound className="size-4" aria-hidden="true" />
        )}
        Update password
      </button>
    </form>
  );
}
