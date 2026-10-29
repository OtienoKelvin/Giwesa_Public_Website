"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { createAuditService } from "@/domains/audit/service";
import { requireAdminApi } from "@/domains/auth/current";
import {
  createProduct,
  getAdminProduct,
  productSchema,
  setProductPublished,
  updateProduct,
} from "@/domains/products/service";
import { prisma } from "@/db/client";
import type { ActionState } from "@/lib/action-state";
import { AppError } from "@/lib/errors";
import { currentClientIp } from "@/lib/request";

const audit = createAuditService(prisma);

function readValues(formData: FormData): Record<string, string> {
  return {
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    eyebrow: String(formData.get("eyebrow") ?? ""),
    tagline: String(formData.get("tagline") ?? ""),
    summary: String(formData.get("summary") ?? ""),
    overview: String(formData.get("overview") ?? ""),
    whoFor: String(formData.get("whoFor") ?? ""),
    howItWorks: String(formData.get("howItWorks") ?? ""),
    benefits: String(formData.get("benefits") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    iconKey: String(formData.get("iconKey") ?? "spark"),
    displayOrder: String(formData.get("displayOrder") ?? "0"),
    seoTitle: String(formData.get("seoTitle") ?? ""),
    seoDescription: String(formData.get("seoDescription") ?? ""),
  };
}

function refreshProducts(slug?: string) {
  updateTag("products");
  revalidatePath("/");
  revalidatePath("/solutions");
  if (slug) revalidatePath(`/solutions/${slug}`);
}

export async function saveProductAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let admin;
  try {
    admin = await requireAdminApi();
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof AppError ? "Your session has expired. Sign in again." : "Unable to save.",
      values: readValues(formData),
    };
  }

  const values = readValues(formData);
  const id = String(formData.get("id") ?? "").trim();
  const parsed = productSchema.safeParse({
    ...values,
    featured: formData.get("featured") === "on",
    published: formData.get("published") === "on",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields and try again.",
      fields: parsed.error.flatten().fieldErrors,
      values,
    };
  }

  if (id && !(await getAdminProduct(id))) {
    return { status: "error", message: "That solution could not be found.", values };
  }

  try {
    if (id) {
      const updated = await updateProduct(id, parsed.data);
      await audit.write({
        action: "product:updated",
        actorUserId: admin.id,
        entityType: "product",
        entityId: id,
        metadata: { slug: updated.slug, published: updated.published },
        ipAddress: await currentClientIp(),
      });
      refreshProducts(updated.slug);
      redirect(`/admin/products/${id}?notice=saved`);
    }

    const created = await createProduct(parsed.data);
    await audit.write({
      action: "product:created",
      actorUserId: admin.id,
      entityType: "product",
      entityId: created.id,
      metadata: { slug: created.slug },
      ipAddress: await currentClientIp(),
    });
    refreshProducts(created.slug);
    redirect(`/admin/products/${created.id}?notice=saved`);
  } catch (error) {
    // Next's redirect is represented by a special error. Preserve it while
    // turning ordinary persistence errors into a safe form message.
    if (typeof error === "object" && error !== null && "digest" in error) throw error;
    return {
      status: "error",
      message: "The solution could not be saved. Please try again.",
      values,
    };
  }
}

export async function toggleProductPublishedAction(formData: FormData): Promise<void> {
  const admin = await requireAdminApi();
  const id = String(formData.get("id") ?? "");
  const product = await getAdminProduct(id);
  if (!product) redirect("/admin/products?notice=missing");

  await setProductPublished(id, !product.published);
  await audit.write({
    action: product.published ? "product:unpublished" : "product:published",
    actorUserId: admin.id,
    entityType: "product",
    entityId: id,
    metadata: { slug: product.slug },
    ipAddress: await currentClientIp(),
  });
  refreshProducts(product.slug);
  redirect(`/admin/products?notice=${product.published ? "unpublished" : "published"}`);
}
