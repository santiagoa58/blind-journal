import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { fetchUserSalt } from "@/api/auth/auth";
import { AUTH_ERROR_CODES } from "@/api/auth/auth.error";
import type { UserSaltResponse } from "@/api/auth/auth.type";
import { API_BASE_URL } from "@/api/constants";
import { users } from "@/mocks/users.mock";
import { mockServer } from "@/tests/mocks/server";

describe("fetchUserSalt", () => {
  it("returns the agreed success envelope for a known username", async () => {
    const existingUser = users[0];

    expect(existingUser).toBeDefined();

    if (!existingUser) {
      throw new Error("The user fixture must contain at least one user.");
    }

    await expect(fetchUserSalt({ username: `  ${existingUser.username}  ` })).resolves.toEqual({
      success: true,
      data: existingUser,
    });
  });

  it("returns the server error envelope instead of throwing for an HTTP error status", async () => {
    await expect(fetchUserSalt({ username: "unknown-user" })).resolves.toEqual({
      success: false,
      error: {
        code: AUTH_ERROR_CODES.userNotFound,
      },
    });
  });

  it("lets the server own request validation", async () => {
    await expect(fetchUserSalt({ username: "   " })).resolves.toEqual({
      success: false,
      error: {
        code: AUTH_ERROR_CODES.usernameRequired,
      },
    });
  });

  it("preserves any stable server error code without client normalization", async () => {
    const response = {
      success: false,
      error: {
        code: "AUTH_RATE_LIMITED",
      },
    } satisfies UserSaltResponse;

    mockServer.use(
      http.post(`${API_BASE_URL}/auth/login`, () =>
        HttpResponse.json(response, {
          status: 429,
        }),
      ),
    );

    await expect(fetchUserSalt({ username: "rate-limited-user" })).resolves.toEqual(response);
  });

  it("leaves transport failures as ordinary request errors", async () => {
    mockServer.use(http.post(`${API_BASE_URL}/auth/login`, () => HttpResponse.error()));

    await expect(fetchUserSalt({ username: "offline-user" })).rejects.toBeInstanceOf(Error);
  });
});
