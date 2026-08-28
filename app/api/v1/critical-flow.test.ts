import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { AUTH_ERROR_CODES } from "@/api/auth/auth.error";
import { JOURNAL_ERROR_CODES } from "@/api/journal/journal.error";
import { REQUEST_ERROR_CODES } from "@/api/request.error";
import { POST as createAccountRoute } from "@/app/api/v1/auth/accounts/route";
import { POST as loginRoute } from "@/app/api/v1/auth/login/route";
import { POST as logoutRoute } from "@/app/api/v1/auth/logout/route";
import { POST as saltRoute } from "@/app/api/v1/auth/salt/route";
import {
  DELETE as deleteEntryRoute,
  PATCH as updateEntryRoute,
} from "@/app/api/v1/entries/[entryId]/route";
import { POST as createEntryRoute, GET as listEntriesRoute } from "@/app/api/v1/entries/route";

const authMocks = vi.hoisted(() => ({
  createAccount: vi.fn(),
  getAuthSalt: vi.fn(),
  verifyCredentials: vi.fn(),
}));
const journalMocks = vi.hoisted(() => ({
  createEntry: vi.fn(),
  deleteEntry: vi.fn(),
  listEntries: vi.fn(),
  updateEntry: vi.fn(),
}));
const sessionMocks = vi.hoisted(() => ({
  endSession: vi.fn(),
  getSessionCookieName: vi.fn(() => "blind-journal-session"),
  getSessionUserId: vi.fn(),
  setSessionCookie: vi.fn(),
  startSession: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/server/auth/auth", () => authMocks);
vi.mock("@/server/auth/session", () => sessionMocks);
vi.mock("@/server/journal/journal", () => journalMocks);

const ORIGIN = "https://blind-journal.test";
const USER_ID = "00000000-0000-4000-8000-000000000001";
const USER = { id: USER_ID, username: "journal.user", displayName: "Journal.User" };

type RequestOptions = {
  body?: string;
  contentType?: string;
  cookie?: string;
  method?: string;
  origin?: string;
};

function routeRequest(path: string, options: RequestOptions = {}): NextRequest {
  const headers = new Headers();
  if (options.origin) headers.set("Origin", options.origin);
  if (options.cookie) headers.set("Cookie", options.cookie);
  if (options.contentType) headers.set("Content-Type", options.contentType);

  return new NextRequest(`${ORIGIN}${path}`, {
    method: options.method ?? "POST",
    headers,
    ...(options.body === undefined ? {} : { body: options.body }),
  });
}

function jsonRequest(
  path: string,
  body: unknown,
  options: Omit<RequestOptions, "body" | "contentType"> = {},
): NextRequest {
  return routeRequest(path, {
    ...options,
    body: JSON.stringify(body),
    contentType: "application/json",
    origin: options.origin ?? ORIGIN,
  });
}

describe("authentication route boundaries", () => {
  it("creates an account and commits only the returned session cookie", async () => {
    authMocks.createAccount.mockResolvedValue({
      success: true,
      data: { apiSession: { user: USER }, sessionId: "new-session-id" },
    });
    const body = { username: USER.username, authKey: "key", keyScheduleVersion: 1, salt: "salt" };

    const response = await createAccountRoute(
      jsonRequest("/api/v1/auth/accounts", body, {
        cookie: "blind-journal-session=previous-session-id",
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ user: USER });
    expect(authMocks.createAccount).toHaveBeenCalledWith(body, "previous-session-id");
    expect(sessionMocks.setSessionCookie).toHaveBeenCalledWith(response, "new-session-id");
  });

  it("keeps login failures generic and does not start a session", async () => {
    authMocks.verifyCredentials.mockResolvedValue({
      success: false,
      error: { code: AUTH_ERROR_CODES.invalidCredentials },
    });

    const response = await loginRoute(
      jsonRequest("/api/v1/auth/login", {
        username: "unknown-user",
        authKey: "key",
        keyScheduleVersion: 1,
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      code: AUTH_ERROR_CODES.invalidCredentials,
    });
    expect(sessionMocks.startSession).not.toHaveBeenCalled();
  });

  it("rejects cross-origin and malformed salt requests before authentication logic", async () => {
    const crossOriginResponse = await saltRoute(
      jsonRequest(
        "/api/v1/auth/salt",
        { username: "journal-user" },
        { origin: "https://attacker.test" },
      ),
    );
    const malformedResponse = await saltRoute(
      routeRequest("/api/v1/auth/salt", {
        body: "{",
        contentType: "application/json",
        origin: ORIGIN,
      }),
    );

    expect(crossOriginResponse.status).toBe(403);
    expect(malformedResponse.status).toBe(400);
    await expect(crossOriginResponse.json()).resolves.toEqual({
      code: REQUEST_ERROR_CODES.forbidden,
    });
    await expect(malformedResponse.json()).resolves.toEqual({
      code: REQUEST_ERROR_CODES.invalid,
    });
    expect(authMocks.getAuthSalt).not.toHaveBeenCalled();
  });

  it("revokes the server session only for a same-origin logout", async () => {
    sessionMocks.endSession.mockResolvedValue(undefined);
    const request = routeRequest("/api/v1/auth/logout", {
      cookie: "blind-journal-session=session-id",
      origin: ORIGIN,
    });

    const response = await logoutRoute(request);

    expect(response.status).toBe(200);
    expect(sessionMocks.endSession).toHaveBeenCalledWith(request, response);
  });
});

describe("journal route boundaries", () => {
  it("rejects an unauthenticated entry list before querying the journal", async () => {
    sessionMocks.getSessionUserId.mockResolvedValue(null);

    const response = await listEntriesRoute(routeRequest("/api/v1/entries", { method: "GET" }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ code: AUTH_ERROR_CODES.unauthorized });
    expect(journalMocks.listEntries).not.toHaveBeenCalled();
  });

  it("passes the authenticated owner and cursor to the journal domain", async () => {
    sessionMocks.getSessionUserId.mockResolvedValue(USER_ID);
    journalMocks.listEntries.mockResolvedValue({
      success: true,
      data: { records: [], nextCursor: null },
    });

    const response = await listEntriesRoute(
      routeRequest("/api/v1/entries?cursor=opaque-cursor", { method: "GET" }),
    );

    expect(response.status).toBe(200);
    expect(journalMocks.listEntries).toHaveBeenCalledWith(USER_ID, {
      cursor: "opaque-cursor",
    });
  });

  it("rejects cross-origin entry creation before reading the session or body", async () => {
    const response = await createEntryRoute(
      jsonRequest(
        "/api/v1/entries",
        { id: crypto.randomUUID() },
        { origin: "https://attacker.test" },
      ),
    );

    expect(response.status).toBe(403);
    expect(sessionMocks.getSessionUserId).not.toHaveBeenCalled();
    expect(journalMocks.createEntry).not.toHaveBeenCalled();
  });

  it("maps a journal write conflict to its stable HTTP response", async () => {
    sessionMocks.getSessionUserId.mockResolvedValue(USER_ID);
    journalMocks.createEntry.mockResolvedValue({
      success: false,
      error: { code: JOURNAL_ERROR_CODES.entryAlreadyExists },
    });

    const response = await createEntryRoute(
      jsonRequest("/api/v1/entries", { id: crypto.randomUUID() }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      code: JOURNAL_ERROR_CODES.entryAlreadyExists,
    });
  });

  it("hides malformed entry identifiers behind the not-found response", async () => {
    sessionMocks.getSessionUserId.mockResolvedValue(USER_ID);
    const context = { params: Promise.resolve({ entryId: "not-a-uuid" }) };

    const updateResponse = await updateEntryRoute(
      jsonRequest("/api/v1/entries/not-a-uuid", { encryptedData: {} }),
      context,
    );
    const deleteResponse = await deleteEntryRoute(
      routeRequest("/api/v1/entries/not-a-uuid", { method: "DELETE", origin: ORIGIN }),
      context,
    );

    expect(updateResponse.status).toBe(404);
    expect(deleteResponse.status).toBe(404);
    expect(journalMocks.updateEntry).not.toHaveBeenCalled();
    expect(journalMocks.deleteEntry).not.toHaveBeenCalled();
  });
});
