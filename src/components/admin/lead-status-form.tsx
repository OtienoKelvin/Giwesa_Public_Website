"use client";

import { useActionState } from "react";
import { Loader2, Save } from "lucide-react";

import { INITIAL_ACTION_STATE, type ActionState } from "@/lib/action-state";

type StatusOption = { value: string; label: string };

export function LeadStatusForm({
  id,
  initialStatus,
  initialNotes,
  statuses,
  action,
  label = "Save update",
}: {
  id: string;
  initialStatus: string;
  initialNotes: string | null;
  statuses: StatusOption[];
  action: (previous: ActionState, formData: FormData) => Promise<ActionState>;
  label?: string;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL_ACTION_STATE);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={id} />
      {state.status === "error" ? (
        <p
          role="alert"
          className="rounded-lg border border-danger/30 bg-danger-soft p-3 text-xs font-semibold text-danger"
        >
          {state.message}
        </p>
      ) : null}
      {state.status === "success" ? (
        <p
          role="status"
          className="rounded-lg border border-[#b9d8c3] bg-[#eef8f1] p-3 text-xs font-semibold text-[#2e6b45]"
        >
          {state.message}
        </p>
      ) : null}

      <div>
        <label htmlFor="lead-status" className="field-label">
          Status
        </label>
        <select
          id="lead-status"
          name="status"
          defaultValue={initialStatus}
          className="field min-h-11"
          aria-invalid={state.fields?.status ? true : undefined}
        >
          {statuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        {state.fields?.status ? (
          <p className="field-error" role="alert">
            {state.fields.status[0]}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="lead-notes" className="field-label">
          Internal notes{" "}
          <span className="font-medium text-ink-muted">(not visible to the visitor)</span>
        </label>
        <textarea
          id="lead-notes"
          name="adminNotes"
          rows={4}
          defaultValue={initialNotes ?? ""}
          className="field min-h-28 resize-y"
          aria-invalid={state.fields?.adminNotes ? true : undefined}
        />
        {state.fields?.adminNotes ? (
          <p className="field-error" role="alert">
            {state.fields.adminNotes[0]}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-10 items-center gap-2 rounded-full bg-brand px-4 text-xs font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? (
          <>
            Saving
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          </>
        ) : (
          <>
            <Save className="size-3.5" aria-hidden="true" />
            {label}
          </>
        )}
      </button>
    </form>
  );
}
