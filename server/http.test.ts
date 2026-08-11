import { describe, expect, it, vi } from "vitest";
import { REQUEST_ERROR_CODES } from "@/api/request.error";
import { readJsonBody, requestErrorResponse } from "@/server/http";

vi.mock("server-only", () => ({}));

const REQUEST_URL = "https://blind-journal.test/api/v1/example";

function jsonRequest(body: string, contentType = "application/json") {
  return new Request(REQUEST_URL, {
    method: "POST",
    headers: { "Content-Type": contentType },
    body,
  });
}

describe("JSON request bodies", () => {
  it("accepts valid JSON without applying domain validation", async () => {
    const request = jsonRequest(JSON.stringify({ journal: true }));

    await expect(readJsonBody(request, 1_024)).resolves.toEqual({
      data: { journal: true },
    });
  });

  it("accepts structured JSON media types", async () => {
    const request = jsonRequest(JSON.stringify({ journal: true }), "application/problem+json");

    await expect(readJsonBody(request, 1_024)).resolves.toEqual({
      data: { journal: true },
    });
  });

  it("classifies missing and malformed JSON as invalid requests", async () => {
    const missingBody = new Request(REQUEST_URL, { method: "POST" });
    const malformedBody = jsonRequest("{");

    await expect(readJsonBody(missingBody, 1_024)).resolves.toEqual({
      error: REQUEST_ERROR_CODES.invalid,
    });
    await expect(readJsonBody(malformedBody, 1_024)).resolves.toEqual({
      error: REQUEST_ERROR_CODES.invalid,
    });
  });

  it("distinguishes unsupported media types", async () => {
    const request = jsonRequest("journal", "text/plain");

    await expect(readJsonBody(request, 1_024)).resolves.toEqual({
      error: REQUEST_ERROR_CODES.unsupportedMediaType,
    });
  });

  it("distinguishes oversized payloads", async () => {
    const request = jsonRequest(JSON.stringify({ journal: "too large" }));

    await expect(readJsonBody(request, 4)).resolves.toEqual({
      error: REQUEST_ERROR_CODES.payloadTooLarge,
    });
  });
});

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
