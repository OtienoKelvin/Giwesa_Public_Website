import { AlertTriangle } from "lucide-react";

export function LegalDraftNotice() {
  return (
    <div className="flex gap-3 rounded-xl border border-warning/30 bg-warning-soft p-4">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
      <div>
        <p className="text-xs font-bold text-[#6f4b00]">Working draft pending legal review</p>
        <p className="mt-1 text-xs leading-5 text-[#7a5b19]">
          This page describes how GIWESA currently intends to handle the website and is awaiting
          final review by GIWESA and its legal adviser. It is not a substitute for the approved
          policy.
        </p>
      </div>
    </div>
  );
}
