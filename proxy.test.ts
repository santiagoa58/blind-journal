import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { NextRequest, NextResponse } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { REQUEST_ID_HEADER } from "@/api/observability";
import { createContentSecurityPolicy } from "@/content-security-policy";
import proxy, { config } from "@/proxy";

const middlewareMocks = vi.hoisted(() => ({ request: undefined as NextRequest | undefined }));
const environmentMocks = vi.hoisted(() => ({ getServerEnvironment: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/server/environment", () => environmentMocks);
vi.mock("next-intl/middleware", () => ({
  default: () => (request: NextRequest) => {
    middlewareMocks.request = request;
    return NextResponse.next({ request: { headers: request.headers } });
  },
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("nonce-based content security policy", () => {
  it("uses the nonce for scripts without allowing inline script execution", () => {
    environmentMocks.getServerEnvironment.mockReturnValue({ nodeEnvironment: "production" });

    const policy = createContentSecurityPolicy("test-nonce");

    expect(policy).toContain("script-src 'self' 'nonce-test-nonce' 'strict-dynamic'");
    expect(policy).toContain("script-src-attr 'none'");
    expect(policy).not.toContain("'unsafe-eval'");
    expect(policy).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(policy).toContain("style-src 'self' 'unsafe-inline'");
    expect(policy).toContain("worker-src 'self'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("upgrade-insecure-requests");
  });

  it("adds only the development script exception needed by Next.js", () => {
    environmentMocks.getServerEnvironment.mockReturnValue({ nodeEnvironment: "development" });

    const policy = createContentSecurityPolicy("test-nonce");

    expect(policy).toMatch(/script-src[^;]*'unsafe-eval'/);
    expect(policy).not.toContain("upgrade-insecure-requests");
  });

  it("generates a fresh nonce and forwards its policy through the i18n proxy", () => {
    environmentMocks.getServerEnvironment.mockReturnValue({ nodeEnvironment: "production" });

    const firstResponse = proxy(new NextRequest("https://blind-journal.test/en"));
    const firstPolicy = firstResponse.headers.get("content-security-policy");
    const firstNonce = middlewareMocks.request?.headers.get("x-nonce");
    const secondResponse = proxy(new NextRequest("https://blind-journal.test/en"));

    expect(firstNonce).toBeTruthy();
    expect(firstPolicy).toBe(createContentSecurityPolicy(firstNonce ?? ""));
    expect(middlewareMocks.request?.headers.get("content-security-policy")).toBe(
      secondResponse.headers.get("content-security-policy"),
    );
    expect(secondResponse.headers.get("content-security-policy")).not.toBe(firstPolicy);
  });

  it("assigns a fresh request ID to API requests without invoking locale routing", () => {
    middlewareMocks.request = undefined;
    const request = new NextRequest("https://blind-journal.test/api/v1/entries", {
      headers: { [REQUEST_ID_HEADER]: "untrusted-client-value" },
    });

    const response = proxy(request);
    const requestId = response.headers.get(REQUEST_ID_HEADER);

    expect(requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(requestId).not.toBe("untrusted-client-value");
    expect(middlewareMocks.request).toBeUndefined();
    expect(response.headers.get("content-security-policy")).toBeNull();
  });

  it("covers dotted document routes without intercepting public assets", () => {
    expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: "/en/missing.page" })).toBe(
      true,
    );
    expect(
      unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: "/icons/icon-192x192.png" }),
    ).toBe(false);
    expect(
      unstable_doesMiddlewareMatch({
        config,
        nextConfig: {},
        url: "/brand/blind-journal-mark.svg",
      }),
    ).toBe(false);
  });
});
