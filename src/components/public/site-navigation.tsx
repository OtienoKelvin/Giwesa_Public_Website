"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, Phone, X } from "lucide-react";

import { PUBLIC_NAV } from "@/config/site";
import { cn } from "@/lib/utils";

type SiteNavigationProps = {
  phone: string;
  phoneHref: string;
};

export function SiteNavigation({ phone, phoneHref }: SiteNavigationProps) {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  function openMenu() {
    dialogRef.current?.showModal();
    setOpen(true);
  }

  function closeMenu() {
    dialogRef.current?.close();
    setOpen(false);
  }

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
        {PUBLIC_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={cn(
              "relative rounded-full px-3.5 py-2 text-[0.8125rem] font-semibold text-ink-muted transition-colors hover:bg-white/70 hover:text-brand",
              isActive(item.href) && "text-brand",
            )}
          >
            {item.label}
            <span
              aria-hidden="true"
              className={cn(
                "absolute inset-x-3.5 -bottom-0.5 h-0.5 scale-x-0 rounded-full bg-sun transition-transform duration-200",
                isActive(item.href) && "scale-x-100",
              )}
            />
          </Link>
        ))}
      </nav>

      <div className="hidden items-center gap-3 lg:flex">
        <a
          href={phoneHref}
          className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-[0.8125rem] font-bold text-ink transition-colors hover:text-brand"
        >
          <Phone className="size-4 text-leaf-dark" aria-hidden="true" />
          <span className="numeric">{phone}</span>
        </a>
        <Link
          href="/book"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-brand bg-brand px-5 text-[0.8125rem] font-bold text-white transition-colors hover:border-brand-dark hover:bg-brand-dark"
        >
          Book a consultation
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      <button
        type="button"
        onClick={openMenu}
        className="inline-flex size-12 items-center justify-center rounded-full border border-line-strong bg-white text-brand transition-colors hover:border-brand lg:hidden"
        aria-label="Open navigation menu"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === dialogRef.current) closeMenu();
        }}
        className="m-0 ml-auto h-dvh max-h-none w-full max-w-none border-0 bg-transparent p-0 backdrop:bg-[#062a4c]/55 lg:hidden"
        aria-label="Site navigation"
      >
        <div className="ml-auto flex h-full w-[min(92vw,24rem)] flex-col overflow-y-auto bg-canvas p-5 shadow-2xl animate-in slide-in-from-right-8 duration-200">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <p className="eyebrow">Menu</p>
            <button
              type="button"
              onClick={closeMenu}
              className="inline-flex size-11 items-center justify-center rounded-full border border-line-strong bg-white text-ink transition-colors hover:border-brand"
              aria-label="Close navigation menu"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          <nav aria-label="Mobile" className="mt-4 flex flex-col">
            {PUBLIC_NAV.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "flex items-center justify-between border-b border-line/80 py-4 font-display text-3xl text-brand-dark transition-colors hover:text-brand",
                  isActive(item.href) && "text-brand",
                )}
              >
                <span>{item.label}</span>
                <span className="font-sans text-[0.625rem] font-bold tracking-[0.2em] text-ink-muted">
                  0{index + 1}
                </span>
              </Link>
            ))}
          </nav>

          <div className="mt-6 space-y-3">
            <Link
              href="/book"
              onClick={closeMenu}
              className="flex min-h-12 w-full items-center justify-between rounded-full bg-brand px-5 text-sm font-bold text-white"
            >
              Book a consultation
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <a
              href={phoneHref}
              className="flex min-h-12 w-full items-center justify-between rounded-full border border-line-strong bg-white px-5 text-sm font-bold text-ink"
            >
              <span className="flex items-center gap-2">
                <Phone className="size-4 text-leaf-dark" aria-hidden="true" />
                Call GIWESA
              </span>
              <span className="numeric text-xs text-ink-muted">{phone}</span>
            </a>
          </div>

          <p className="mt-auto pt-8 text-xs leading-6 text-ink-muted">
            Savings, micro-loans and welfare protection with a team that starts by listening.
          </p>
        </div>
      </dialog>
    </>
  );
}
