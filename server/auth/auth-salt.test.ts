import { afterEach, describe, expect, it, vi } from "vitest";
import { CURRENT_AUTH_KEY_SCHEDULE } from "@/api/auth/auth-key-schedule";
import { base64ToUint8Array } from "@/crypto/base64";
import { deriveAuthSalt } from "@/server/auth/auth-salt";

vi.mock("server-only", () => ({}));

const SECRET = Buffer.alloc(32, 1).toString("base64url");

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("authentication salts", () => {
  it("derives stable, username-specific salts of the protocol length", () => {
    vi.stubEnv("AUTH_SALT_SECRET", SECRET);

    const salt = deriveAuthSalt("journal.user");

    expect(salt).toBe("+CcbPQseMrnkxUVTxiGn/g==");
    expect(deriveAuthSalt("journal.user")).toBe(salt);
    expect(deriveAuthSalt("another.user")).not.toBe(salt);
    expect(base64ToUint8Array(salt)).toHaveLength(
      CURRENT_AUTH_KEY_SCHEDULE.passwordKdf.saltLengthBytes,
    );
  });

  it("changes derived salts when the server secret changes", () => {
    vi.stubEnv("AUTH_SALT_SECRET", SECRET);
    const firstSalt = deriveAuthSalt("journal.user");

    vi.stubEnv("AUTH_SALT_SECRET", Buffer.alloc(32, 2).toString("base64url"));

    expect(deriveAuthSalt("journal.user")).not.toBe(firstSalt);
  });

  it.each(["not base64!", Buffer.alloc(31).toString("base64url")])(
    "rejects an invalid configured secret",
    (secret) => {
      vi.stubEnv("AUTH_SALT_SECRET", secret);

      expect(() => deriveAuthSalt("journal.user")).toThrow("AUTH_SALT_SECRET");
    },
  );

  it("fails closed when the production secret is missing", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_SALT_SECRET", "");

    expect(() => deriveAuthSalt("journal.user")).toThrow(
      "AUTH_SALT_SECRET must be configured in production.",
    );
  });
});
