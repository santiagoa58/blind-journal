import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { endSession, getSessionUserId, startSession, toSessionHash } from "@/server/auth/session";

const sessionDatabaseMocks = vi.hoisted(() => ({
  deleteSession: vi.fn(),
  findSessionUserId: vi.fn(),
  replaceSession: vi.fn(),
}));
const environmentMocks = vi.hoisted(() => ({ getServerEnvironment: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/server/database/sessions", () => sessionDatabaseMocks);
vi.mock("@/server/environment", () => environmentMocks);

const SESSION_COOKIE_NAME = "blind-journal-session";
const HOST_SESSION_COOKIE_NAME = `__Host-${SESSION_COOKIE_NAME}`;

function cookieRequest(name: string, value: string) {
  return new NextRequest("https://blind-journal.test/api/v1/entries", {
    headers: { cookie: `${name}=${value}` },
  });
}

function requestWithoutCookies() {
  return new NextRequest("https://blind-journal.test/api/v1/auth/login");
}

function sessionIdFrom(response: NextResponse): string {
  const cookie =
    response.cookies.get(SESSION_COOKIE_NAME) ?? response.cookies.get(HOST_SESSION_COOKIE_NAME);
  if (!cookie) throw new Error("The session cookie was not created.");
  return cookie.value;
}

beforeEach(() => {
  sessionDatabaseMocks.deleteSession.mockResolvedValue(undefined);
  sessionDatabaseMocks.findSessionUserId.mockResolvedValue(undefined);
  sessionDatabaseMocks.replaceSession.mockResolvedValue(undefined);
  environmentMocks.getServerEnvironment.mockReturnValue({ nodeEnvironment: "test" });
});

describe("session cookie policy", () => {
  it("uses a development-safe cookie over local HTTP", async () => {
    environmentMocks.getServerEnvironment.mockReturnValue({ nodeEnvironment: "development" });
    const response = NextResponse.json(null);

    await startSession(requestWithoutCookies(), response, crypto.randomUUID());

    const setCookie = response.headers.get("set-cookie");
    expect(setCookie).toContain(`${SESSION_COOKIE_NAME}=`);
    expect(setCookie).not.toContain("__Host-");
    expect(setCookie).not.toContain("Secure");
    expect(setCookie).toContain("Path=/");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=lax");
  });

  it("uses the hardened __Host- cookie contract in production", async () => {
    environmentMocks.getServerEnvironment.mockReturnValue({ nodeEnvironment: "production" });
    const response = NextResponse.json(null);

    await startSession(requestWithoutCookies(), response, crypto.randomUUID());

    const setCookie = response.headers.get("set-cookie");
    expect(setCookie).toContain(`${HOST_SESSION_COOKIE_NAME}=`);
    expect(setCookie).toContain("Secure");
    expect(setCookie).toContain("Path=/");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=lax");
    expect(setCookie).not.toContain("Domain=");
  });

  it("persists and revokes only the hash of a production bearer token", async () => {
    environmentMocks.getServerEnvironment.mockReturnValue({ nodeEnvironment: "production" });
    const userId = crypto.randomUUID();
    const startResponse = NextResponse.json(null);
    await startSession(requestWithoutCookies(), startResponse, userId);
    const sessionId = sessionIdFrom(startResponse);
    const sessionHash = toSessionHash(sessionId);
    if (!sessionHash) throw new Error("The session token was malformed.");

    expect(sessionDatabaseMocks.replaceSession).toHaveBeenCalledWith(
      expect.objectContaining({ sessionHash, userId }),
      undefined,
    );
    expect(sessionDatabaseMocks.replaceSession).not.toHaveBeenCalledWith(
      expect.objectContaining({ sessionHash: sessionId }),
      expect.anything(),
    );

    sessionDatabaseMocks.findSessionUserId.mockResolvedValue(userId);
    const request = cookieRequest(HOST_SESSION_COOKIE_NAME, sessionId);
    expect(await getSessionUserId(request)).toBe(userId);

    const endResponse = NextResponse.json(null);
    await endSession(request, endResponse);
    expect(sessionDatabaseMocks.deleteSession).toHaveBeenCalledWith(sessionHash);
    expect(endResponse.headers.get("set-cookie")).toContain(
      `${HOST_SESSION_COOKIE_NAME}=; Path=/; Max-Age=0`,
    );
    expect(endResponse.headers.get("set-cookie")).toContain("Secure");
    expect(endResponse.headers.get("set-cookie")).not.toContain("Domain=");
  });

  it("passes the previous session hash into atomic session replacement", async () => {
    environmentMocks.getServerEnvironment.mockReturnValue({ nodeEnvironment: "development" });
    const previousSessionId = "a".repeat(43);
    const previousSessionHash = toSessionHash(previousSessionId);
    const response = NextResponse.json(null);

    await startSession(
      cookieRequest(SESSION_COOKIE_NAME, previousSessionId),
      response,
      crypto.randomUUID(),
    );

    expect(sessionDatabaseMocks.replaceSession).toHaveBeenCalledWith(
      expect.objectContaining({ sessionHash: expect.any(String) }),
      previousSessionHash,
    );
  });
});
