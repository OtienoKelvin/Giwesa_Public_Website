import "dotenv/config";

import { spawnSync } from "node:child_process";

const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl) {
  console.error("TEST_DATABASE_URL is required. See .env.example.");
  process.exit(1);
}

let databaseName = "";
try {
  databaseName = new URL(testUrl).pathname.replace(/^\//, "");
} catch {
  console.error("TEST_DATABASE_URL is not a valid connection URL.");
  process.exit(1);
}
if (!databaseName.endsWith("_test")) {
  console.error("Refusing to run integration tests: the test database must end in _test.");
  process.exit(1);
}

const env = {
  ...process.env,
  NODE_ENV: "test",
  APP_URL: "http://localhost:3000",
  DATABASE_URL: testUrl,
  MEDIA_ROOT: ".qa/test-uploads",
  SMTP_HOST: "",
  SMTP_FROM_EMAIL: "",
  NOTIFICATION_EMAIL: "",
};

function run(args) {
  const isWindows = process.platform === "win32";
  const result = isWindows
    ? spawnSync(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", args.join(" ")], {
        env,
        stdio: "inherit",
      })
    : spawnSync(args[0], args.slice(1), { env, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(`Applying committed migrations to ${databaseName}...`);
run(["pnpm", "exec", "prisma", "migrate", "deploy"]);
console.log("Running integration tests...");
run(["pnpm", "exec", "vitest", "run", "tests/integration", "--no-file-parallelism"]);
