import type { Metadata } from "next";
import type { ReactNode } from "react";

import { requireAdminPage } from "@/domains/auth/current";
import { AdminChrome } from "@/components/admin/admin-chrome";

export const instant = false;

export const metadata: Metadata = {
  title: {
    default: "Admin | GIWESA Solutions",
    template: "%s | GIWESA Admin",
  },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdminPage();
  return <AdminChrome admin={admin}>{children}</AdminChrome>;
}
