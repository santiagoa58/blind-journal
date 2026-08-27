import { afterEach, describe, expect, it, vi } from "vitest";
import { REQUEST_ID_HEADER } from "@/api/observability";
import { onRequestError, register } from "@/instrumentation";

const environmentMocks = vi.hoisted(() => ({ getServerEnvironment: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/server/environment", () => environmentMocks);

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("server startup instrumentation", () => {
  it("validates the complete environment before the Node.js server becomes ready", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");

    await register();

    expect(environmentMocks.getServerEnvironment).toHaveBeenCalledOnce();
  });

  it("does not import Node.js configuration into the Edge runtime", async () => {
    vi.stubEnv("NEXT_RUNTIME", "edge");

    await register();

    expect(environmentMocks.getServerEnvironment).not.toHaveBeenCalled();
  });
});

describe("server request error instrumentation", () => {
  it("writes one production-safe structured event with its request ID", async () => {
    environmentMocks.getServerEnvironment.mockReturnValue({ nodeEnvironment: "production" });
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
    environmentMocks.getServerEnvironment.mockReturnValue({ nodeEnvironment: "development" });
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
