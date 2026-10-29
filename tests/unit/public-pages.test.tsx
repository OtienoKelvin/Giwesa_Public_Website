// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { HomeHero } from "@/components/public/home/hero";
import { LatestInsights } from "@/components/public/home/latest-insights";
import { SolutionsList } from "@/components/public/home/solutions-list";
import { ProductTerms } from "@/components/public/product-terms";
import type { PublicPostCard } from "@/domains/blog/service";
import type { PublicProductCard } from "@/domains/products/service";
import type { PublicSiteSettings } from "@/domains/site-settings/service";
import { PRODUCT_TERMS } from "@/config/site";

const settings: PublicSiteSettings = {
  phone: "+254 117 598094",
  email: "info@giwesasolutions.co.ke",
  address: "Homa Bay, Kenya",
  officeHours: null,
  facebookUrl: null,
  instagramUrl: null,
  linkedinUrl: null,
  xUrl: null,
  heroEyebrow: "Savings · Micro-loans · Welfare",
  heroTitle: "Savings, loans and welfare protection, made for everyday life.",
  heroDescription:
    "GIWESA Solutions is a Kenyan microfinance organisation helping individuals, families and small businesses plan, save, borrow and protect what matters.",
};

const products: PublicProductCard[] = [
  {
    id: "p1",
    slug: "savings-and-loans",
    name: "Savings & micro-loans",
    eyebrow: "Save with purpose",
    tagline: "Build a habit today. Open the door to what comes next.",
    summary: "Flexible savings and savings-linked micro-loans.",
    iconKey: "sprout",
    featured: true,
    displayOrder: 1,
  },
  {
    id: "p2",
    slug: "welfare-protection",
    name: "Welfare protection",
    eyebrow: "Stand together",
    tagline: "A plan for the unexpected.",
    summary: "Monthly welfare packages for families.",
    iconKey: "shield",
    featured: false,
    displayOrder: 2,
  },
  {
    id: "p3",
    slug: "community-development",
    name: "Community development",
    eyebrow: "Grow together",
    tagline: "Practical partnerships for shared progress.",
    summary: "Partnerships for financial inclusion.",
    iconKey: "people",
    featured: false,
    displayOrder: 3,
  },
];

const posts: PublicPostCard[] = [
  {
    id: "b1",
    slug: "five-saving-habits",
    title: "Five small saving habits that can make a real difference",
    excerpt: "Practical saving habits for everyday life.",
    category: "FINANCIAL_WELLBEING",
    coverImage: "/insights/cover-savings.png",
    coverAlt: "Saving illustration",
    authorName: "GIWESA Editorial",
    publishedAt: new Date("2026-10-06T09:00:00+03:00"),
  },
  {
    id: "b2",
    slug: "saving-and-borrowing",
    title: "Saving and borrowing: what is the difference?",
    excerpt: "Understanding the difference can make both decisions clearer.",
    category: "FINANCIAL_WELLBEING",
    coverImage: "/insights/cover-borrowing.png",
    coverAlt: "Borrowing illustration",
    authorName: "GIWESA Editorial",
    publishedAt: new Date("2026-09-18T09:00:00+03:00"),
  },
  {
    id: "b3",
    slug: "family-protection",
    title: "Planning for family protection",
    excerpt: "Questions to ask before choosing welfare cover.",
    category: "FINANCIAL_WELLBEING",
    coverImage: "/insights/cover-welfare.png",
    coverAlt: "Family protection illustration",
    authorName: "GIWESA Editorial",
    publishedAt: new Date("2026-08-29T09:00:00+03:00"),
  },
];

describe("public homepage sections", () => {
  it("renders the hero message and primary actions", () => {
    render(<HomeHero settings={settings} />);
    expect(
      screen.getByRole("heading", {
        name: /savings, loans and welfare protection, made for everyday life/i,
      }),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: /explore our solutions/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /talk to giwesa/i })).toBeTruthy();
  });

  it("renders all public solutions", () => {
    render(<SolutionsList products={products} />);
    expect(screen.getByText("Savings & micro-loans")).toBeTruthy();
    expect(screen.getByText("Welfare protection")).toBeTruthy();
    expect(screen.getByText("Community development")).toBeTruthy();
  });

  it("renders the latest published insights", () => {
    render(<LatestInsights posts={posts} />);
    expect(screen.getByText("Useful reading, not financial noise.")).toBeTruthy();
    expect(
      screen.getByText("Five small saving habits that can make a real difference"),
    ).toBeTruthy();
  });

  it("renders confirmed welfare package terms", () => {
    render(<ProductTerms terms={PRODUCT_TERMS["welfare-protection"]} />);
    expect(screen.getByText("KES 30,000")).toBeTruthy();
    expect(screen.getByText("KES 100,000")).toBeTruthy();
    expect(screen.getByText(/Girwa Radio 99.5 FM/i)).toBeTruthy();
  });
});
