import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { createAccount, login } from "@/api/auth/auth";
import { AUTH_ERROR_CODES } from "@/api/auth/auth.error";
import type { LoginResponse } from "@/api/auth/auth.type";
import { API_BASE_URL } from "@/api/constants";
import { mockServer } from "@/tests/mocks/server";

describe("auth API", () => {
  it("logs in with the seeded account and returns the agreed envelope", async () => {
    await expect(login({ username: "  summertime  ", password: "journal123" })).resolves.toEqual({
      success: true,
      data: {
        user: {
          id: "user-1",
          username: "summertime",
          displayName: "Summer Time",
        },
      },
    });
  });

  it("returns a stable code for invalid credentials", async () => {
    await expect(login({ username: "summertime", password: "incorrect" })).resolves.toEqual({
      success: false,
      error: { code: AUTH_ERROR_CODES.invalidCredentials },
    });
  });

  it("creates a distinct account through the account endpoint", async () => {
    const response = await createAccount({
      username: "new_writer",
      password: "private-journal",
      confirmPassword: "private-journal",
    });

    expect(response).toMatchObject({
      success: true,
      data: {
        user: {
          username: "new_writer",
          displayName: "new_writer",
        },
      },
    });
  });

  it("validates account confirmation on the local server", async () => {
    await expect(
      createAccount({
        username: "new_writer",
        password: "private-journal",
        confirmPassword: "different-password",
      }),
    ).resolves.toEqual({
      success: false,
      error: { code: AUTH_ERROR_CODES.passwordsMismatch },
    });
  });

  it("preserves a stable server error code without client normalization", async () => {
    const response = {
      success: false,
      error: { code: "AUTH_RATE_LIMITED" },
    } satisfies LoginResponse;

    mockServer.use(
      http.post(`${API_BASE_URL}/auth/login`, () => HttpResponse.json(response, { status: 429 })),
    );

    await expect(login({ username: "rate-limited-user", password: "password" })).resolves.toEqual(
      response,
    );
  });

  it("leaves transport failures as ordinary request errors", async () => {
    mockServer.use(http.post(`${API_BASE_URL}/auth/login`, () => HttpResponse.error()));

    await expect(login({ username: "offline-user", password: "password" })).rejects.toBeInstanceOf(
      Error,
    );
  });
});
