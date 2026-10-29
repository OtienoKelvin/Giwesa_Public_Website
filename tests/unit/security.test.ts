import { describe, expect, it } from "vitest";

import { createRateLimiter } from "@/lib/rate-limit";
import { slugify } from "@/lib/slug";
import { canManageContent, canManageLeads, canManageSettings } from "@/domains/auth/types";

describe("rate limiter", () => {
  it("allows the configured number of attempts and then blocks", () => {
    let now = 1_000;
    const limiter = createRateLimiter({ limit: 2, windowMs: 1_000, now: () => now });
    expect(limiter.consume("ip").allowed).toBe(true);
    expect(limiter.consume("ip").allowed).toBe(true);
    expect(limiter.consume("ip").allowed).toBe(false);
    now += 1_001;
    expect(limiter.consume("ip").allowed).toBe(true);
  });
});

describe("slug generation", () => {
  it("normalises titles and provides a fallback", () => {
    expect(slugify("Saving & Borrowing: A Guide")).toBe("saving-borrowing-a-guide");
    expect(slugify("   ")).toBe("article");
  });
});

describe("role policy", () => {
  it("limits settings and lead access to administrators", () => {
    expect(canManageSettings({ role: "ADMIN" })).toBe(true);
    expect(canManageSettings({ role: "CONTENT_MANAGER" })).toBe(false);
    expect(canManageLeads({ role: "ADMIN" })).toBe(true);
    expect(canManageLeads({ role: "CONTENT_MANAGER" })).toBe(false);
    expect(canManageContent({ role: "CONTENT_MANAGER" })).toBe(true);
  });
});
