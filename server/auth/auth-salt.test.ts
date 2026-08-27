import { beforeEach, describe, expect, it, vi } from "vitest";
import { CURRENT_AUTH_KEY_SCHEDULE } from "@/api/auth/auth-key-schedule";
import { base64ToUint8Array } from "@/crypto/base64";
import { deriveAuthSalt } from "@/server/auth/auth-salt";

const environmentMocks = vi.hoisted(() => ({ getServerEnvironment: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/server/environment", () => environmentMocks);

const SECRET = Buffer.alloc(32, 1);

beforeEach(() => {
  environmentMocks.getServerEnvironment.mockReturnValue({ authSaltSecret: SECRET });
});

describe("authentication salts", () => {
  it("derives stable, username-specific salts of the protocol length", () => {
    const salt = deriveAuthSalt("journal.user");

    expect(salt).toBe("+CcbPQseMrnkxUVTxiGn/g==");
    expect(deriveAuthSalt("journal.user")).toBe(salt);
    expect(deriveAuthSalt("another.user")).not.toBe(salt);
    expect(base64ToUint8Array(salt)).toHaveLength(
      CURRENT_AUTH_KEY_SCHEDULE.passwordKdf.saltLengthBytes,
    );
  });

  it("changes derived salts when the server secret changes", () => {
    const firstSalt = deriveAuthSalt("journal.user");

    environmentMocks.getServerEnvironment.mockReturnValue({
      authSaltSecret: Buffer.alloc(32, 2),
    });

    expect(deriveAuthSalt("journal.user")).not.toBe(firstSalt);
  });
});
