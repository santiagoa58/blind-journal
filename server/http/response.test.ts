import { describe, expect, it, vi } from "vitest";
import { REQUEST_ERROR_CODES } from "@/lib/api/request.error";
import { requestErrorResponse } from "@/server/http/response";

vi.mock("server-only", () => ({}));

describe("request error responses", () => {
  it.each([
    [REQUEST_ERROR_CODES.invalid, 400],
    [REQUEST_ERROR_CODES.forbidden, 403],
    [REQUEST_ERROR_CODES.payloadTooLarge, 413],
    [REQUEST_ERROR_CODES.unsupportedMediaType, 415],
  ] as const)("maps %s to HTTP %i", async (code, expectedStatus) => {
    const response = requestErrorResponse(code);

    expect(response.status).toBe(expectedStatus);
    await expect(response.json()).resolves.toEqual({ code });
  });
});
