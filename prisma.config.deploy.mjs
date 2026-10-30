/**
 * Production migration configuration.
 *
 * This file is copied into the packaged release as `prisma.config.mjs`. It is
 * deliberately import-free so the Prisma CLI can load it on the host without
 * dotenv or any development tooling. `DATABASE_URL` is supplied by the host
 * environment (from a protected deploy env file), never by GitHub and never by
 * a file inside the release.
 *
 * There is intentionally no seed command. Production deployment runs
 * `prisma migrate deploy` only.
 */
const deployConfig = {
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    path: "prisma/migrations",
  },
};

export default deployConfig;
