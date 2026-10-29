"use client";

import { useState } from "react";
import { useActionState } from "react";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";

import { loginAction } from "@/app/admin/actions";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(loginAction, INITIAL_ACTION_STATE);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="space-y-5" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {state.status === "error" ? (
        <div
          role="alert"
          className="flex gap-3 rounded-xl border border-danger/30 bg-danger-soft p-4 text-sm font-semibold leading-6 text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{state.message}</span>
        </div>
      ) : null}

      <div>
        <label htmlFor="admin-email" className="field-label">
          Email address
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="you@giwesasolutions.co.ke"
          className="field"
          aria-required="true"
          aria-invalid={state.fields?.email ? true : undefined}
          aria-describedby={state.fields?.email ? "admin-email-error" : undefined}
        />
        {state.fields?.email ? (
          <p id="admin-email-error" className="field-error" role="alert">
            {state.fields.email[0]}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="admin-password" className="field-label">
          Password
        </label>
        <div className="relative">
          <input
            id="admin-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            className="field pr-12"
            aria-required="true"
            aria-invalid={state.fields?.password ? true : undefined}
            aria-describedby={state.fields?.password ? "admin-password-error" : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-ink-muted hover:text-brand"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {state.fields?.password ? (
          <p id="admin-password-error" className="field-error" role="alert">
            {state.fields.password[0]}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 w-full items-center justify-between rounded-full bg-brand px-5 text-sm font-bold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <>
            Signing in
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          </>
        ) : (
          <>
            Sign in to admin
            <ArrowRight className="size-4" aria-hidden="true" />
          </>
        )}
      </button>

      <div className="flex items-start gap-2.5 rounded-xl border border-line bg-canvas p-3.5">
        <LockKeyhole className="mt-0.5 size-3.5 shrink-0 text-leaf-dark" aria-hidden="true" />
        <p className="text-[0.6875rem] leading-5 text-ink-muted">
          This is a staff-only area. Sessions expire automatically and are stored securely. Public
          registration is not available.
        </p>
      </div>
    </form>
  );
}
