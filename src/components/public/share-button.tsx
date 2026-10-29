"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";

export function ShareButton({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setMessage("Link copied to clipboard");
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setMessage("Could not copy the link. You can copy it from the address bar.");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={share}
        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line-strong bg-white px-4 text-xs font-bold text-brand transition-colors hover:border-brand"
      >
        {copied ? (
          <Check className="size-3.5 text-leaf-dark" aria-hidden="true" />
        ) : (
          <Link2 className="size-3.5" aria-hidden="true" />
        )}
        {copied ? "Link copied" : "Share article"}
      </button>
      <p aria-live="polite" className="mt-2 min-h-4 text-[0.6875rem] leading-4 text-ink-muted">
        {message}
      </p>
    </div>
  );
}
