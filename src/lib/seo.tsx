import "server-only";

import { siteUrl } from "@/config/env";
import { BLOG_CATEGORY_LABELS, SITE } from "@/config/site";
import type { PublicPost } from "@/domains/blog/service";
import type { PublicSiteSettings } from "@/domains/site-settings/service";

export function absoluteUrl(path: string): string {
  return new URL(path, `${siteUrl}/`).toString();
}

export function organizationJsonLd(settings: PublicSiteSettings) {
  const sameAs = [
    settings.facebookUrl,
    settings.instagramUrl,
    settings.linkedinUrl,
    settings.xUrl,
  ].filter((url): url is string => Boolean(url));

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: SITE.name,
    legalName: SITE.legalName,
    url: siteUrl,
    logo: absoluteUrl("/giwesa-logo.jpg"),
    description: SITE.description,
    telephone: settings.phone,
    email: settings.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.address,
      addressLocality: "Homa Bay",
      addressRegion: "Homa Bay County",
      addressCountry: "KE",
    },
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: siteUrl,
    name: SITE.name,
    description: SITE.description,
    publisher: { "@id": `${siteUrl}/#organization` },
    inLanguage: "en-KE",
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqJsonLd(items: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function articleJsonLd(post: PublicPost) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(`/insights/${post.slug}`) },
    ...(post.coverImage ? { image: absoluteUrl(post.coverImage) } : {}),
    author: {
      "@type": post.authorName.toLowerCase().includes("giwesa") ? "Organization" : "Person",
      name: post.authorName,
    },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      logo: { "@type": "ImageObject", url: absoluteUrl("/giwesa-logo.jpg") },
    },
    articleSection: BLOG_CATEGORY_LABELS[post.category] ?? post.category,
    inLanguage: "en-KE",
  };
}

export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify escapes content, and `<` is escaped to prevent a tag
      // from closing this script element if editorial content ever contains it.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
