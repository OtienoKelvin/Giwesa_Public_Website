import { headers } from "next/headers";

export function clientIpFromHeaders(headersList: Headers): string {
  const forwarded = headersList.get("x-forwarded-for");
  const candidate = forwarded?.split(",")[0]?.trim() || headersList.get("x-real-ip") || "local";
  return candidate.slice(0, 80);
}

export async function currentClientIp(): Promise<string> {
  return clientIpFromHeaders(await headers());
}

/**
 * Explicit origin check for our own mutation route handlers. Server Actions
 * already receive framework-level origin validation; the media route does not.
 */
export function requestHasTrustedOrigin(request: Request, appUrl: string): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(appUrl).origin;
  } catch {
    return false;
  }
}

export function safeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/admin";
  }
  return value;
}
