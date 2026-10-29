import type { Metadata } from "next";

import { requireAdminPage } from "@/domains/auth/current";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "New solution" };

export default async function NewProductPage() {
  await requireAdminPage();
  return (
    <>
      <AdminPageHeader
        title="New solution"
        description="Add a public solution. Only publish details that are confirmed GIWESA information."
        backHref="/admin/products"
      />
      <ProductForm />
    </>
  );
}
