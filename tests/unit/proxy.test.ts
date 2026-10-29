import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { proxy } from "@/proxy";
import { SESSION_COOKIE_NAME } from "@/domains/auth/session-token";

describe("admin route proxy", () => {
  it("redirects an anonymous admin request to sign in", () => {
    const response = proxy(new NextRequest("http://localhost:3000/admin/inquiries"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/admin/login");
    expect(response.headers.get("location")).toContain("next=%2Fadmin%2Finquiries");
  });

  it("allows the login route", () => {
    const response = proxy(new NextRequest("http://localhost:3000/admin/login"));
    expect(response.status).toBe(200);
  });

  it("allows a request carrying the opaque session cookie through the optimistic check", () => {
    const request = new NextRequest("http://localhost:3000/admin", {
      headers: { cookie: `${SESSION_COOKIE_NAME}=opaque-token` },
    });
    const response = proxy(request);
    expect(response.status).toBe(200);
  });
});
