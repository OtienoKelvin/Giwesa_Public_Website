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
      MEDIA_ROOT: ".qa/test-uploads",
      MEDIA_MAX_BYTES: "4194304",
      SMTP_HOST: "",
      SMTP_FROM_EMAIL: "",
      NOTIFICATION_EMAIL: "",
    },
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
