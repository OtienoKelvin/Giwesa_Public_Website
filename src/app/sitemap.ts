import type { MetadataRoute } from "next";

import { siteUrl } from "@/config/env";
import { getPublishedSlugs } from "@/domains/blog/service";
import { getPublicProducts } from "@/domains/products/service";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, slugs] = await Promise.all([getPublicProducts(), getPublishedSlugs()]);
  const base = siteUrl.replace(/\/+$/, "");

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/about`, changeFrequency: "yearly", priority: 0.7 },
    { url: `${base}/solutions`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/insights`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/contact`, changeFrequency: "yearly", priority: 0.7 },
    { url: `${base}/book`, changeFrequency: "yearly", priority: 0.6 },
  ];

  return [
    ...staticRoutes,
    ...products.map((product) => ({
      url: `${base}/solutions/${product.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...slugs.map((slug) => ({
      url: `${base}/insights/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
