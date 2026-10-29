import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/domains/auth/session-token";

/**
 * Optimistic routing guard only. It checks for the presence of the opaque
 * session cookie; the database-backed check still happens in every admin layout,
 * page and server action. This keeps the first paint quick without trusting the
 * cookie for authorization.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!hasSessionCookie) {
    const loginUrl = new URL("/admin/login", request.url);
    if (pathname !== "/admin") loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
