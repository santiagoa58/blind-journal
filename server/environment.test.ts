import { describe, expect, it, vi } from "vitest";
import { validateServerEnvironment } from "@/server/environment";

vi.mock("server-only", () => ({}));

const DATABASE_URL =
  "postgresql://blind_journal_app:password@example-pooler.us-east-2.aws.neon.tech/neondb";
const AUTH_SALT_SECRET = Buffer.alloc(32, 1).toString("base64url");

function validEnvironment(): NodeJS.ProcessEnv {
  return {
    NODE_ENV: "production",
    DATABASE_URL,
    AUTH_SALT_SECRET,
  };
}

describe("server environment", () => {
  it("returns fully validated and resolved configuration", () => {
    const environment = validateServerEnvironment(validEnvironment());

    expect(environment).toEqual({
      nodeEnvironment: "production",
      databaseUrl: DATABASE_URL,
      authSaltSecret: Buffer.alloc(32, 1),
    });
  });

  it("reports every invalid variable without exposing its value", () => {
    const privateValue = "not base64!";

    expect(() =>
      validateServerEnvironment({
        NODE_ENV: "staging",
        DATABASE_URL: "not-a-database-url",
        AUTH_SALT_SECRET: privateValue,
      }),
    ).toThrowError(
      new Error(
        "Invalid server environment:\n" +
          "- NODE_ENV must be development, production, or test.\n" +
          "- DATABASE_URL must be a valid pooled PostgreSQL connection URL.\n" +
          "- AUTH_SALT_SECRET must be Base64URL encoded.",
      ),
    );

    try {
      validateServerEnvironment({
        NODE_ENV: "staging",
        DATABASE_URL: "not-a-database-url",
        AUTH_SALT_SECRET: privateValue,
      });
    } catch (error) {
      expect(String(error)).not.toContain(privateValue);
    }
  });

  it("requires every production secret", () => {
    expect(() => validateServerEnvironment({ NODE_ENV: "production" })).toThrowError(
      "Invalid server environment:\n" +
        "- DATABASE_URL is required.\n" +
        "- AUTH_SALT_SECRET is required in production.",
    );
  });

  it("uses the deterministic non-production salt secret when none is configured", () => {
    const environment = validateServerEnvironment({
      NODE_ENV: "development",
      DATABASE_URL,
    });

    expect(environment.authSaltSecret.byteLength).toBeGreaterThanOrEqual(32);
  });

  it.each([
    [
      "postgresql://neondb_owner:password@example-pooler.us-east-2.aws.neon.tech/neondb",
      "restricted blind_journal_app role",
    ],
    [
      "postgresql://blind_journal_app@example-pooler.us-east-2.aws.neon.tech/neondb",
      "include a database password",
    ],
    [
      "postgresql://blind_journal_app:password@example.us-east-2.aws.neon.tech/neondb",
      "valid pooled PostgreSQL connection URL",
    ],
    [
      "mysql://blind_journal_app:password@example-pooler.us-east-2.aws.neon.tech/neondb",
      "valid pooled PostgreSQL connection URL",
    ],
  ])("rejects an unsafe database connection", (databaseUrl, expectedMessage) => {
    expect(() =>
      validateServerEnvironment({
        ...validEnvironment(),
        DATABASE_URL: databaseUrl,
      }),
    ).toThrow(expectedMessage);
  });
});
