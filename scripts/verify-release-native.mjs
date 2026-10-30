#!/usr/bin/env node
/**
 * Verify a packaged release by executing its native dependencies from inside
 * the release tree. This is intentionally not a `require()` smoke test: a native
 * binding can resolve while failing at runtime because it was built for the
 * wrong platform.
 *
 * Usage:
 *   node scripts/verify-release-native.mjs <release-dir> [--expect-commit <sha7>]
 */
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const releaseDir = path.resolve(process.argv[2] ?? "");
if (!releaseDir || !existsSync(releaseDir)) {
  console.error("[verify] usage: node scripts/verify-release-native.mjs <release-dir>");
  process.exit(1);
}

const commitIndex = process.argv.indexOf("--expect-commit");
const expectedCommit = commitIndex >= 0 ? process.argv[commitIndex + 1]?.toLowerCase() : undefined;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  assert(
    process.platform === "linux",
    `native verification must run on Linux, got ${process.platform}`,
  );
  for (const required of [
    "server.js",
    "package.json",
    "release.json",
    ".next/static",
    "node_modules/next/package.json",
    "prisma/schema.prisma",
    "prisma/migrations",
  ]) {
    assert(existsSync(path.join(releaseDir, required)), `missing ${required}`);
  }

  const manifest = JSON.parse(readFileSync(path.join(releaseDir, "release.json"), "utf8"));
  if (expectedCommit) {
    assert(
      String(manifest.commit).toLowerCase().startsWith(expectedCommit),
      `release.json commit ${manifest.commit} does not match ${expectedCommit}`,
    );
  }
  assert(manifest.application === "giwesa-public-home", "release.json has the wrong application");
  assert(manifest.migrations === true, "release.json does not declare migration support");

  const requireFromRelease = createRequire(path.join(releaseDir, "package.json"));
  const { hash, verify } = requireFromRelease("@node-rs/argon2");
  const password = "giwesa-release-native-gate";
  const digest = await hash(password);
  assert(typeof digest === "string" && digest.length > 30, "Argon2 did not return a digest");
  assert(await verify(digest, password), "Argon2 verify failed for the correct password");
  assert(!(await verify(digest, "wrong-password")), "Argon2 verify accepted the wrong password");

  const sharp = requireFromRelease("sharp");
  const png = await sharp({
    create: { width: 32, height: 24, channels: 3, background: "#013e77" },
  })
    .png()
    .toBuffer();
  const webp = await sharp(png).webp().toBuffer({ resolveWithObject: true });
  assert(webp.info.format === "webp", "sharp did not produce WebP");
  assert(
    webp.info.width === 32 && webp.info.height === 24,
    "sharp changed the test image dimensions",
  );

  console.log(
    `[verify] native OK: Argon2 hash/verify and sharp PNG→WebP executed from ${path.basename(releaseDir)}`,
  );
} catch (error) {
  console.error(`[verify] FAILED: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
