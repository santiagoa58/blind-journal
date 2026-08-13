import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { endSession, getSessionUserId, startSession } from "@/server/session";
import { serverStore } from "@/server/store";

vi.mock("server-only", () => ({}));

const SESSION_COOKIE_NAME = "blind-journal-session";
const HOST_SESSION_COOKIE_NAME = `__Host-${SESSION_COOKIE_NAME}`;

function cookieRequest(name: string, value: string) {
  return new NextRequest("https://blind-journal.test/api/v1/entries", {
    headers: { cookie: `${name}=${value}` },
  });
}

beforeEach(() => {
  serverStore.sessions.clear();
});

afterEach(() => {
  serverStore.sessions.clear();
  vi.unstubAllEnvs();
});

describe("session cookie policy", () => {
  it("uses a development-safe cookie over local HTTP", () => {
    vi.stubEnv("NODE_ENV", "development");
    const response = NextResponse.json(null);

    startSession(response, crypto.randomUUID());

    const setCookie = response.headers.get("set-cookie");
    expect(setCookie).toContain(`${SESSION_COOKIE_NAME}=`);
    expect(setCookie).not.toContain("__Host-");
    expect(setCookie).not.toContain("Secure");
    expect(setCookie).toContain("Path=/");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=lax");
  });

  it("uses the hardened __Host- cookie contract in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const response = NextResponse.json(null);

    startSession(response, crypto.randomUUID());

    const setCookie = response.headers.get("set-cookie");
    expect(setCookie).toContain(`${HOST_SESSION_COOKIE_NAME}=`);
    expect(setCookie).toContain("Secure");
    expect(setCookie).toContain("Path=/");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=lax");
    expect(setCookie).not.toContain("Domain=");
  });

  it("reads, revokes, and clears the production cookie with the same policy", () => {
    vi.stubEnv("NODE_ENV", "production");
    const startResponse = NextResponse.json(null);
    const userId = crypto.randomUUID();
    startSession(startResponse, userId);
    const sessionId = serverStore.sessions.keys().next().value;
    if (!sessionId) {
      throw new Error("The session was not created.");
    }
    const request = cookieRequest(HOST_SESSION_COOKIE_NAME, sessionId);
    const endResponse = NextResponse.json(null);

    expect(getSessionUserId(request)).toBe(userId);
    endSession(request, endResponse);

    expect(serverStore.sessions.has(sessionId)).toBe(false);
    expect(endResponse.headers.get("set-cookie")).toContain(
      `${HOST_SESSION_COOKIE_NAME}=; Path=/; Max-Age=0`,
    );
    expect(endResponse.headers.get("set-cookie")).toContain("Secure");
    expect(endResponse.headers.get("set-cookie")).not.toContain("Domain=");
  });
});
