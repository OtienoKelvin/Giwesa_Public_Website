import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAdminPage } from "@/domains/auth/current";
import { getAdminProduct } from "@/domains/products/service";
import { AdminNotice, AdminPageHeader } from "@/components/admin/admin-ui";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "Edit solution" };

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const product = await getAdminProduct(id);
  if (!product) notFound();
  const query = await searchParams;

  return (
    <>
      <AdminPageHeader
        title={product.name}
        description={`/solutions/${product.slug}`}
        backHref="/admin/products"
      />
      {query.notice === "saved" ? <AdminNotice>Solution saved.</AdminNotice> : null}
      <ProductForm
        initial={{
          id: product.id,
          slug: product.slug,
          name: product.name,
          eyebrow: product.eyebrow,
          tagline: product.tagline,
          summary: product.summary,
          overview: product.overview,
          whoFor: product.whoFor,
          howItWorks: product.howItWorks,
          benefits: product.benefits,
          notes: product.notes,
          iconKey: product.iconKey,
          featured: product.featured,
          published: product.published,
          displayOrder: product.displayOrder,
          seoTitle: product.seoTitle,
          seoDescription: product.seoDescription,
        }}
      />
    </>
  );
}
