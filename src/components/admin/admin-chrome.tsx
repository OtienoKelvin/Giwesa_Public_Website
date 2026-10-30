"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarCheck,
  ExternalLink,
  LayoutDashboard,
  Layers3,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  UsersRound,
  X,
} from "lucide-react";

import { logoutAction } from "@/app/admin/actions";
import { ADMIN_ROLE_LABELS, type AuthenticatedAdmin } from "@/domains/auth/types";
import { Logo } from "@/components/public/logo";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
};

function navigationFor(role: AuthenticatedAdmin["role"]): NavItem[] {
  const items: NavItem[] = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/blog", label: "Insights", icon: BookOpen },
    { href: "/admin/products", label: "Solutions", icon: Layers3 },
  ];
  if (role === "ADMIN") {
    items.splice(2, 0, { href: "/admin/inquiries", label: "Inquiries", icon: UsersRound });
    items.splice(3, 0, { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck });
    items.push({ href: "/admin/settings", label: "Settings", icon: Settings });
  }
  return items;
}

export function AdminChrome({
  admin,
  children,
}: {
  admin: AuthenticatedAdmin;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = navigationFor(admin.role);
  const current = [...nav]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) =>
      item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href),
    );

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  function openMenu() {
    dialogRef.current?.showModal();
    setMenuOpen(true);
  }
  function closeMenu() {
    dialogRef.current?.close();
    setMenuOpen(false);
  }

  const sidebar = (mobile = false) => (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-5">
        <Link
          href="/admin"
          className="flex items-center gap-3"
          onClick={mobile ? closeMenu : undefined}
        >
          <Logo tone="dark" sizes="52px" className="size-11" />
          <span>
            <span className="block text-[0.5625rem] font-bold uppercase tracking-[0.18em] text-[#e7d6ad]">
              GIWESA
            </span>
            <span className="mt-0.5 block text-[0.8125rem] font-bold text-white">
              Staff workspace
            </span>
          </span>
        </Link>
        {mobile ? (
          <button
            type="button"
            onClick={closeMenu}
            className="inline-flex size-10 items-center justify-center rounded-full border border-white/20 text-white"
            aria-label="Close admin navigation"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <nav aria-label="Admin" className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
        <p className="px-3 text-[0.5625rem] font-bold uppercase tracking-[0.18em] text-white/40">
          Workspace
        </p>
        <ul className="mt-3 space-y-1">
          {nav.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={mobile ? closeMenu : undefined}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[0.8125rem] font-semibold text-white/65 transition-colors hover:bg-white/10 hover:text-white",
                    active && "bg-white/10 text-white",
                  )}
                >
                  {active ? (
                    <span
                      className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-sun"
                      aria-hidden="true"
                    />
                  ) : null}
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-8 border-t border-white/10 pt-5">
          <p className="px-3 text-[0.5625rem] font-bold uppercase tracking-[0.18em] text-white/40">
            Public site
          </p>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex items-center justify-between rounded-lg px-3 py-2.5 text-[0.8125rem] font-semibold text-white/65 transition-colors hover:bg-white/10 hover:text-white"
          >
            View website
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
        </div>
      </nav>

      <div className="shrink-0 border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
            {admin.name.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-white">{admin.name}</p>
            <p className="truncate text-[0.625rem] text-white/45">
              {ADMIN_ROLE_LABELS[admin.role]}
            </p>
          </div>
        </div>
        <Link
          href="/admin/settings/security"
          onClick={mobile ? closeMenu : undefined}
          className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          Account security
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut className="size-3.5" aria-hidden="true" />
            Sign out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="admin-shell h-dvh overflow-hidden lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="hidden h-dvh min-h-0 overflow-hidden bg-[#062a4c] lg:flex lg:flex-col">
        {sidebar()}
      </aside>

      <dialog
        ref={dialogRef}
        onClose={() => setMenuOpen(false)}
        onClick={(event) => {
          if (event.target === dialogRef.current) closeMenu();
        }}
        className="m-0 h-dvh max-h-none w-full max-w-none border-0 bg-transparent p-0 backdrop:bg-[#062a4c]/60 lg:hidden"
        aria-label="Admin navigation"
      >
        <div className="h-dvh w-[min(88vw,18rem)] bg-[#062a4c] shadow-2xl animate-in slide-in-from-left-8 duration-200">
          {sidebar(true)}
        </div>
      </dialog>

      <div className="flex h-dvh min-h-0 min-w-0 flex-col overflow-hidden">
        <header className="z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-admin-line bg-white/95 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={openMenu}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-admin-line text-ink transition-colors hover:border-brand lg:hidden"
              aria-label="Open admin navigation"
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
            >
              <Menu className="size-4" aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <p className="text-[0.5625rem] font-bold uppercase tracking-[0.15em] text-ink-muted">
                GIWESA admin
              </p>
              <p className="truncate text-sm font-bold text-brand-dark">
                {current?.label ?? "Overview"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 rounded-full border border-admin-line px-3 py-2 text-[0.6875rem] font-bold text-ink-muted transition-colors hover:border-brand hover:text-brand sm:inline-flex"
            >
              View website
              <ExternalLink className="size-3" aria-hidden="true" />
            </a>
            <span className="hidden items-center gap-1.5 rounded-full bg-leaf-light px-3 py-2 text-[0.625rem] font-bold uppercase tracking-[0.08em] text-leaf-dark sm:inline-flex">
              <ShieldCheck className="size-3" aria-hidden="true" />
              {ADMIN_ROLE_LABELS[admin.role]}
            </span>
            <span className="flex size-9 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
              {admin.name.slice(0, 1).toUpperCase()}
            </span>
          </div>
        </header>

        <main
          id="main-content"
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
