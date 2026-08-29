import { describe, expect, it, vi } from "vitest";
import { requireDatabaseTestUrl } from "./live-test-environment";

const DATABASE_TEST_URL =
  "postgresql://test_runtime:password@test-database.example.com/journal_test";

describe("live test environment", () => {
  it("accepts the configured PostgreSQL test database", () => {
    vi.stubEnv("DATABASE_TEST_URL", DATABASE_TEST_URL);

    expect(requireDatabaseTestUrl()).toBe(DATABASE_TEST_URL);
  });

  it("rejects a missing database test URL", () => {
    vi.stubEnv("DATABASE_TEST_URL", "");

    expect(() => requireDatabaseTestUrl()).toThrow(
      "DATABASE_TEST_URL is required for tests that write to the database.",
    );
  });

  it("rejects a non-PostgreSQL test URL", () => {
    vi.stubEnv("DATABASE_TEST_URL", "mysql://test_runtime:password@database.example.com/test");

    expect(() => requireDatabaseTestUrl()).toThrow(
      "DATABASE_TEST_URL must be a valid PostgreSQL connection URL.",
    );
  });
});
