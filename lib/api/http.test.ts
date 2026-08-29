import { afterEach, describe, expect, it, vi } from "vitest";
import { API_ERROR_CODES } from "@/lib/api/error";
import { api } from "@/lib/api/http";
import { REQUEST_ID_HEADER } from "@/lib/api/observability";

vi.mock("@/lib/api/constants", () => ({
  API_BASE_PATH: "https://blind-journal.test/api/v1/",
}));

afterEach(() => {
  vi.useRealTimers();
});

describe("API transport retry policy", () => {
  it("uses the same-origin credential policy", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(Response.json({ ok: true }));

    await api.get("origin-test", { fetch });

    const request = fetch.mock.calls[0]?.[0];
    expect(request).toBeInstanceOf(Request);
    expect((request as Request).credentials).toBe("same-origin");
    expect((request as Request).url).toBe("https://blind-journal.test/api/v1/origin-test");
  });

  it("retries a GET once after a network failure", async () => {
    vi.useFakeTimers();
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(Response.json({ ok: true }));

    const responsePromise = api.get("retry-test", { fetch }).json();
    await vi.runAllTimersAsync();

    await expect(responsePromise).resolves.toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("does not retry an HTTP application failure", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(new Response(null, { status: 503 }));

    await expect(api.get("retry-test", { fetch })).rejects.toMatchObject({
      response: { status: 503 },
    });
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("does not retry mutations after a network failure", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockRejectedValue(new TypeError("fetch failed"));

    await expect(api.post("retry-test", { fetch })).rejects.toMatchObject({
      name: "NetworkError",
    });
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("preserves request cancellation without trying to decorate its read-only code", async () => {
    const abortError = new DOMException("The operation was aborted.", "AbortError");
    const fetch = vi.fn<typeof globalThis.fetch>().mockRejectedValue(abortError);

    await expect(api.get("cancelled-request", { fetch })).rejects.toBe(abortError);
    expect(fetch).toHaveBeenCalledOnce();
  });
});

describe("API error observability", () => {
  it("preserves the server error code and request ID on HTTP errors", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(
        Response.json(
          { code: "JOURNAL_INVALID_ENTRY" },
          { status: 422, headers: { [REQUEST_ID_HEADER]: "server-request-id" } },
        ),
      );

    await expect(api.get("error-test", { fetch })).rejects.toMatchObject({
      code: "JOURNAL_INVALID_ENTRY",
      requestId: "server-request-id",
    });
  });

  it("preserves the request ID when an HTTP response has no valid API error body", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response("Internal Server Error", {
        status: 500,
        headers: { [REQUEST_ID_HEADER]: "unexpected-request-id" },
      }),
    );

    await expect(api.get("error-test", { fetch })).rejects.toMatchObject({
      code: API_ERROR_CODES.unexpected,
      requestId: "unexpected-request-id",
    });
  });
});
