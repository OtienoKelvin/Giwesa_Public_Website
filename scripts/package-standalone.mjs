#!/usr/bin/env node
/**
 * Assemble the deployable GIWESA public website release.
 *
 * The release is built from `next build` with `output: "standalone"` plus a
 * link-free production dependency tree installed from the frozen lockfile on
 * Linux. It deliberately does NOT copy the whole `.next/standalone` directory:
 * Turbopack can include build-machine files there (including `.env`).
 *
 * Output:
 *   .release/giwesa-public-home-<version>-<short-sha>/
 *   .release/giwesa-public-home-<version>-<short-sha>.tar.gz
 *
 * Production deployment uploads the exact tarball that passed CI.
 */
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const STANDALONE = path.join(ROOT, ".next", "standalone");
const STATIC = path.join(ROOT, ".next", "static");
const PUBLIC = path.join(ROOT, "public");
const PRISMA = path.join(ROOT, "prisma");
const DEPLOY_CONFIG = path.join(ROOT, "prisma.config.deploy.mjs");
const NATIVE_VERIFIER = path.join(ROOT, "scripts", "verify-release-native.mjs");
const OUT_ROOT = path.resolve(ROOT, process.env.RELEASE_OUT_DIR ?? ".release");

function fail(message) {
  console.error(`\n[package] FAILED: ${message}\n`);
  process.exit(1);
}

function step(message) {
  console.log(`[package] ${message}`);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: "inherit", ...options });
  if (result.error) fail(`${command} could not start: ${result.error.message}`);
  if (result.status !== 0) fail(`${command} ${args.join(" ")} exited ${result.status}`);
}

function resolveCommit() {
  const fromEnv = (process.env.GITHUB_SHA ?? process.env.APP_COMMIT ?? "").trim();
  if (fromEnv) return fromEnv.toLowerCase();
  const result = spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  if (result.status !== 0) return "";
  return result.stdout.trim().toLowerCase();
}

function buildIdentity() {
  const serverPath = path.join(STANDALONE, "server.js");
  const server = readFileSync(serverPath, "utf8");
  const marker = "const nextConfig = ";
  const start = server.indexOf(marker);
  const end = start >= 0 ? server.indexOf("\n\nprocess.env.__NEXT_PRIVATE", start) : -1;
  if (start < 0 || end < 0) fail("could not read the standalone build identity from server.js");
  let config;
  try {
    config = JSON.parse(server.slice(start + marker.length, end));
  } catch {
    fail("could not parse the standalone build identity");
  }
  return {
    version: config.env?.APP_VERSION ?? "",
    commit: config.env?.APP_COMMIT ?? "",
  };
}

function assertLinux() {
  if (process.platform !== "linux") {
    fail(
      `the release must be assembled on Linux (current platform: ${process.platform}). ` +
        "This protects the Linux native binaries for @node-rs/argon2 and sharp.",
    );
  }
}

function runtimeDependencyStage(releaseName) {
  const stage = path.join(OUT_ROOT, `.stage-${releaseName}`);
  rmSync(stage, { recursive: true, force: true });
  mkdirSync(stage, { recursive: true });

  const pkg = JSON.parse(readFileSync(path.join(ROOT, "package.json"), "utf8"));
  // Keep the dependency declarations byte-for-byte compatible with the frozen
  // lockfile, but do not run project lifecycle scripts inside the staging tree.
  const stagePkg = { ...pkg, scripts: {} };
  writeFileSync(path.join(stage, "package.json"), `${JSON.stringify(stagePkg, null, 2)}\n`);

  for (const file of ["pnpm-lock.yaml", "pnpm-workspace.yaml"]) {
    if (existsSync(path.join(ROOT, file))) cpSync(path.join(ROOT, file), path.join(stage, file));
  }

  step("installing Linux production dependencies from the frozen lockfile");
  run(
    "pnpm",
    [
      "install",
      "--prod",
      "--frozen-lockfile",
      "--node-linker=hoisted",
      "--config.confirmModulesPurge=false",
    ],
    { cwd: stage },
  );

  const stagedModules = path.join(stage, "node_modules");
  if (!existsSync(stagedModules)) fail("pnpm did not create a production node_modules tree");
  return { stage, stagedModules };
}

function copyPublic(source, destination) {
  // Local uploads are persistent user data, never release content. Production
  // maps this directory to app/shared/uploads at activation time.
  cpSync(source, destination, {
    recursive: true,
    dereference: true,
    filter: (file) => {
      const relative = path.relative(PUBLIC, file);
      return relative !== "uploads" && !relative.startsWith(`uploads${path.sep}`);
    },
  });
}

function scanUnsafe(releaseDir) {
  const problems = [];
  const forbiddenNames = new Set([".storage", ".git", ".qa"]);
  const sensitiveValues = ["DATABASE_URL", "SMTP_PASSWORD", "DEPLOY_SSH_KEY"]
    .map((name) => process.env[name])
    .filter((value) => typeof value === "string" && value.length >= 8);

  const walk = (dir, inNodeModules = false) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const relative = path.relative(releaseDir, full);
      const envFile = entry.name === ".env" || entry.name.startsWith(".env.");
      if ((envFile || forbiddenNames.has(entry.name)) && !inNodeModules) {
        problems.push(`${relative}${entry.isDirectory() ? "/" : ""}`);
        continue;
      }
      if (entry.isDirectory()) {
        walk(full, inNodeModules || entry.name === "node_modules");
        continue;
      }
      if (inNodeModules) continue;
      if (!/\.(js|mjs|cjs|json|txt|md|ts|tsx|prisma|sql|ya?ml)$/.test(entry.name)) continue;
      if (statSync(full).size > 1_500_000) continue;
      const text = readFileSync(full, "utf8");
      for (const value of sensitiveValues) {
        if (text.includes(value))
          problems.push(`${relative} contains a sensitive environment value`);
      }
    }
  };
  walk(releaseDir);
  return problems;
}

function measure(dir) {
  let files = 0;
  let bytes = 0;
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else {
        files += 1;
        bytes += statSync(full).size;
      }
    }
  }
  return { files, bytes };
}

try {
  assertLinux();
  step(`working directory: ${ROOT}`);
  step(`output directory: ${path.relative(ROOT, OUT_ROOT) || "."}/`);

  if (!existsSync(path.join(STANDALONE, "server.js"))) {
    fail("`.next/standalone/server.js` is missing. Run `pnpm build` with output: standalone.");
  }
  if (!existsSync(STATIC)) fail("`.next/static` is missing; the release would have no CSS/JS.");
  if (!existsSync(PUBLIC)) fail("`public/` is missing.");
  if (!existsSync(path.join(PRISMA, "schema.prisma"))) fail("`prisma/schema.prisma` is missing.");
  if (!existsSync(path.join(PRISMA, "migrations"))) fail("`prisma/migrations` is missing.");
  if (!existsSync(DEPLOY_CONFIG)) fail("`prisma.config.deploy.mjs` is missing.");

  const commit = resolveCommit();
  if (!/^[0-9a-f]{40}$/.test(commit)) {
    fail("a full 40-character commit SHA is required (set APP_COMMIT or run in a Git checkout)");
  }
  const shortCommit = commit.slice(0, 7);

  const identity = buildIdentity();
  if (identity.commit !== commit) {
    fail(
      `build identity mismatch: build has APP_COMMIT=${identity.commit || "(missing)"}, ` +
        `release is ${commit}. Rebuild with APP_COMMIT=${commit}.`,
    );
  }
  if (!identity.version) fail("the build has no APP_VERSION identity");

  const buildId = readFileSync(path.join(ROOT, ".next", "BUILD_ID"), "utf8").trim();
  const pkg = JSON.parse(readFileSync(path.join(ROOT, "package.json"), "utf8"));
  const releaseName = `${pkg.name}-${identity.version}-${shortCommit}`;
  const releaseDir = path.join(OUT_ROOT, releaseName);
  const archivePath = path.join(OUT_ROOT, `${releaseName}.tar.gz`);

  rmSync(archivePath, { force: true });
  rmSync(releaseDir, { recursive: true, force: true });
  mkdirSync(releaseDir, { recursive: true });

  step(`assembling ${path.relative(ROOT, releaseDir)}`);
  cpSync(path.join(STANDALONE, ".next"), path.join(releaseDir, ".next"), {
    recursive: true,
    dereference: true,
  });
  cpSync(path.join(STANDALONE, "server.js"), path.join(releaseDir, "server.js"));
  cpSync(path.join(ROOT, "package.json"), path.join(releaseDir, "package.json"));
  mkdirSync(path.join(releaseDir, ".next", "static"), { recursive: true });
  cpSync(STATIC, path.join(releaseDir, ".next", "static"), { recursive: true, dereference: true });
  copyPublic(PUBLIC, path.join(releaseDir, "public"));

  mkdirSync(path.join(releaseDir, "prisma"), { recursive: true });
  cpSync(path.join(PRISMA, "schema.prisma"), path.join(releaseDir, "prisma", "schema.prisma"));
  cpSync(path.join(PRISMA, "migrations"), path.join(releaseDir, "prisma", "migrations"), {
    recursive: true,
    dereference: true,
  });
  cpSync(DEPLOY_CONFIG, path.join(releaseDir, "prisma.config.mjs"));

  const { stage, stagedModules } = runtimeDependencyStage(releaseName);
  step("moving the production dependency tree into the release");
  const releaseModules = path.join(releaseDir, "node_modules");
  rmSync(releaseModules, { recursive: true, force: true });
  renameSync(stagedModules, releaseModules);
  rmSync(stage, { recursive: true, force: true });
  rmSync(path.join(releaseModules, ".pnpm"), { recursive: true, force: true });

  const manifest = {
    application: "giwesa-public-home",
    version: identity.version,
    commit,
    commitShort: shortCommit,
    buildId,
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    packagedAt: new Date().toISOString(),
    packageManager: "pnpm@12.3.4",
    migrations: true,
    entrypoint: "server.js",
  };
  writeFileSync(path.join(releaseDir, "release.json"), `${JSON.stringify(manifest, null, 2)}\n`);

  step("running native verification from inside the assembled release");
  run(process.execPath, [NATIVE_VERIFIER, releaseDir, "--expect-commit", shortCommit]);

  const unsafe = scanUnsafe(releaseDir);
  if (unsafe.length > 0) {
    fail(`release contains unsafe content: ${unsafe.join(", ")}`);
  }

  step("creating the release archive");
  run("tar", ["-czf", archivePath, "-C", OUT_ROOT, releaseName]);
  if (!existsSync(archivePath) || statSync(archivePath).size === 0) {
    fail("the archive was not created");
  }

  const { files, bytes } = measure(releaseDir);
  const archiveSize = statSync(archivePath).size;
  console.log("\n[package] release ready");
  console.log(`          directory: ${path.relative(ROOT, releaseDir)}`);
  console.log(`             files: ${files}`);
  console.log(`       unpacked: ${(bytes / 1024 / 1024).toFixed(1)} MB`);
  console.log(`          archive: ${path.relative(ROOT, archivePath)}`);
  console.log(`     archive size: ${(archiveSize / 1024 / 1024).toFixed(1)} MB`);
  console.log(`           commit: ${shortCommit}`);
  console.log(`        build id: ${buildId}`);
  console.log(`     native gate: Argon2 hash+verify and sharp encode passed`);
  console.log(
    "   migrate (host): node node_modules/prisma/build/index.js migrate deploy --config prisma.config.mjs --schema prisma/schema.prisma",
  );
  console.log("   start (host):   NODE_ENV=production HOSTNAME=0.0.0.0 node server.js");
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
