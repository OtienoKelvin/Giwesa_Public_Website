#!/usr/bin/env node
/**
 * Run the exact packaged release against a throwaway MySQL database.
 *
 * This starts the artifact's own `server.js`, applies only committed migrations
 * from the artifact, and checks the public health, homepage and admin-login
 * surfaces. It never seeds production data and refuses non-`_test` databases.
 *
 * Usage:
 *   SMOKE_DATABASE_URL=mysql://.../giwesa_public_smoke_test \
 *   SMOKE_EXPECT_COMMIT=<sha> node scripts/smoke-standalone.mjs .release/<release>
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";

const releaseDir = path.resolve(process.argv[2] ?? "");
if (!releaseDir || !existsSync(releaseDir)) {
  console.error("[smoke] usage: node scripts/smoke-standalone.mjs <release-dir>");
  process.exit(1);
}

const databaseUrl = process.env.SMOKE_DATABASE_URL ?? process.env.DATABASE_URL ?? "";
let databaseName = "";
try {
  databaseName = new URL(databaseUrl).pathname.replace(/^\//, "");
} catch {
  // handled below
}
if (!databaseName.endsWith("_test")) {
  console.error("[smoke] refusing to run: the database name must end in _test");
  process.exit(1);
}

const expectedCommit = (process.env.SMOKE_EXPECT_COMMIT ?? "").trim().toLowerCase();
const port = Number(process.env.SMOKE_PORT ?? "3100");
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  console.error("[smoke] SMOKE_PORT must be a valid unprivileged port");
  process.exit(1);
}

const mediaRoot = mkdtempSync(path.join(tmpdir(), "giwesa-public-smoke-media-"));
const logs = [];
let child;

function logChunk(chunk) {
  const text = chunk.toString();
  logs.push(text);
  process.stdout.write(text);
}

function stopServer() {
  if (!child || child.exitCode !== null) return;
  child.kill("SIGTERM");
  const force = setTimeout(() => {
    if (child && child.exitCode === null) child.kill("SIGKILL");
  }, 5_000);
  force.unref();
  child.once("exit", () => clearTimeout(force));
}

try {
  const migrations = spawnSync(
    process.execPath,
    [
      "node_modules/prisma/build/index.js",
      "migrate",
      "deploy",
      "--config",
      "prisma.config.mjs",
      "--schema",
      "prisma/schema.prisma",
    ],
    {
      cwd: releaseDir,
      env: { ...process.env, DATABASE_URL: databaseUrl, NODE_ENV: "production" },
      stdio: "inherit",
    },
  );
  if (migrations.status !== 0) {
    throw new Error(`release migrations failed with exit code ${migrations.status}`);
  }

  console.log(`[smoke] starting packaged server on 127.0.0.1:${port}`);
  child = spawn(process.execPath, ["server.js"], {
    cwd: releaseDir,
    env: {
      ...process.env,
      NODE_ENV: "production",
      HOSTNAME: "127.0.0.1",
      PORT: String(port),
      APP_URL: `http://127.0.0.1:${port}`,
      DATABASE_URL: databaseUrl,
      MEDIA_ROOT: mediaRoot,
      SMTP_HOST: "",
      SMTP_USER: "",
      SMTP_PASSWORD: "",
      SMTP_FROM_EMAIL: "",
      NOTIFICATION_EMAIL: "",
      NEXT_TELEMETRY_DISABLED: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", logChunk);
  child.stderr.on("data", logChunk);

  let health;
  for (let attempt = 1; attempt <= 60; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`, {
        signal: AbortSignal.timeout(4_000),
      });
      if (response.ok) {
        health = await response.json();
        break;
      }
    } catch {
      // server is still starting
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  if (!health) throw new Error("the packaged server did not return a healthy /api/health response");
  if (health.status !== "ok" || health.database !== "up") {
    throw new Error(`health was not ok: ${JSON.stringify(health)}`);
  }
  if (
    !health.commit ||
    (expectedCommit && !String(health.commit).toLowerCase().startsWith(expectedCommit))
  ) {
    throw new Error(
      `health commit ${health.commit ?? "(missing)"} does not match expected ${expectedCommit || "(any)"}`,
    );
  }

  const home = await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(8_000) });
  const homeText = await home.text();
  if (home.status !== 200 || !homeText.includes("GIWESA")) {
    throw new Error(`homepage check failed: HTTP ${home.status}`);
  }

  const login = await fetch(`http://127.0.0.1:${port}/admin/login`, {
    signal: AbortSignal.timeout(8_000),
  });
  const loginText = await login.text();
  if (login.status !== 200 || !loginText.includes("Sign in")) {
    throw new Error(`admin login check failed: HTTP ${login.status}`);
  }

  const manifest = JSON.parse(readFileSync(path.join(releaseDir, "release.json"), "utf8"));
  console.log(
    `[smoke] PASS — ${manifest.application} ${manifest.version} (${manifest.commitShort}), health/${home.status}/admin/login OK`,
  );
} catch (error) {
  console.error(`[smoke] FAILED: ${error instanceof Error ? error.message : String(error)}`);
  if (child) {
    console.error("[smoke] server logs (tail):");
    console.error(logs.join("").split(/\r?\n/).slice(-40).join("\n"));
  }
  process.exitCode = 1;
} finally {
  stopServer();
  rmSync(mediaRoot, { recursive: true, force: true });
}
