import "dotenv/config";

import { defineConfig, env } from "prisma/config";

/**
 * Prisma 7 reads the connection URL from this file rather than from
 * `schema.prisma`, and no longer auto-loads `.env`. The application itself
 * validates its environment centrally in `src/config/env.ts`.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
});
