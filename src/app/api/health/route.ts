import { NextResponse } from "next/server";
import { connection } from "next/server";

import { APP_COMMIT, APP_VERSION } from "@/config/app-version";
import { prisma } from "@/db/client";

/**
 * Public deployment health check.
 *
 * `connection()` stops prerendering before the database probe: a health result
 * must never be baked into the static build. The payload intentionally contains
 * no credentials, paths, environment values or visitor data.
 */
export async function GET() {
  await connection();

  let database: "up" | "down" = "down";
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "up";
  } catch {
    database = "down";
  }

  const healthy = database === "up";
  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      service: "giwesa-public",
      database,
      version: APP_VERSION,
      commit: APP_COMMIT,
    },
    {
      status: healthy ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
