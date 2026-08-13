import { afterEach, describe, expect, it, vi } from "vitest";
import { REQUEST_ID_HEADER } from "@/api/observability";
import { onRequestError } from "@/instrumentation";

vi.mock("server-only", () => ({}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("server request error instrumentation", () => {
  it("writes one production-safe structured event with its request ID", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await onRequestError(
      Object.assign(new Error("database detail that must not be logged"), {
        name: "private-user-value",
      }),
      {
        method: "POST",
        path: "/api/v1/entries?cursor=sensitive",
        headers: { [REQUEST_ID_HEADER]: "server-request-id", cookie: "private-session" },
      },
      {
        routerKind: "App Router",
        routePath: "/api/v1/entries",
        routeType: "route",
        revalidateReason: undefined,
      },
    );

    expect(log).toHaveBeenCalledOnce();
    const event = JSON.parse(String(log.mock.calls[0]?.[0]));
    expect(event).toEqual({
      level: "error",
      event: "server.request.failed",
      method: "POST",
      route: "/api/v1/entries",
      routeType: "route",
      errorName: "Error",
      requestId: "server-request-id",
    });
    expect(JSON.stringify(event)).not.toContain("database detail");
    expect(JSON.stringify(event)).not.toContain("private-user-value");
    expect(JSON.stringify(event)).not.toContain("private-session");
    expect(JSON.stringify(event)).not.toContain("sensitive");
  });

  it("includes exception diagnostics during local development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const error = new TypeError("local diagnostic");

    await onRequestError(
      error,
      { method: "GET", path: "/en/journal", headers: {} },
      {
        routerKind: "App Router",
        routePath: "/[locale]/journal",
        routeType: "render",
        renderSource: "server-rendering",
        revalidateReason: undefined,
      },
    );

    const event = JSON.parse(String(log.mock.calls[0]?.[0]));
    expect(event).toMatchObject({
      errorMessage: "local diagnostic",
      errorName: "TypeError",
    });
    expect(event.errorStack).toContain("TypeError: local diagnostic");
  });
});
