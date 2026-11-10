import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// `src/config/env.ts` validates this at import time. Unit tests never open a
// connection, so a placeholder is enough. Integration runs already carry the
// real TEST_DATABASE_URL and must not have it replaced.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "mysql://test:test@localhost:3306/giwesa_public_test";
}

afterEach(() => {
  cleanup();
});
