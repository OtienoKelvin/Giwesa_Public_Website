import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: {
      // `server-only` throws outside the Next.js server build. This stub keeps
      // the guard in production bundles while letting server modules be tested.
      "server-only": fileURLToPath(new URL("./tests/setup/server-only-stub.ts", import.meta.url)),
      // Caching directives require the Next.js runtime. Tests exercise the
      // underlying data operations with the cache API stubbed out.
      "next/cache": fileURLToPath(new URL("./tests/setup/next-cache-stub.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    setupFiles: ["tests/setup/testing.ts"],
    env: {
      NODE_ENV: "test",
      APP_URL: "http://localhost:3000",
      // `src/config/env.ts` validates its shape at import time. Unit tests never
      // open a connection; the value only satisfies that validation.
      DATABASE_URL: "mysql://test:test@localhost:3306/giwesa_public_test",
      MEDIA_ROOT: ".qa/test-uploads",
      MEDIA_MAX_BYTES: "4194304",
      SMTP_HOST: "",
      SMTP_FROM_EMAIL: "",
      NOTIFICATION_EMAIL: "",
      // The membership channel is server-to-server; these test values let the
      // signing/error-mapping suites exercise `fms-client` without a real FMS.
      // Every test stubs `fetch`, so no request leaves the process.
      FMS_API_URL: "https://fms.test",
      FMS_CHANNEL_KEY: "test-channel-key",
      FMS_CHANNEL_SECRET: "test-channel-secret-0123456789abcdef",
      FMS_REQUEST_TIMEOUT_MS: "5000",
    },
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
