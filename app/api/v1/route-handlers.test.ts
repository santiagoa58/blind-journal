import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { POST as createAccountRoute } from "@/app/api/v1/auth/accounts/route";
import { POST as loginRoute } from "@/app/api/v1/auth/login/route";
import { POST as logoutRoute } from "@/app/api/v1/auth/logout/route";
import { POST as saltRoute } from "@/app/api/v1/auth/salt/route";
import {
  DELETE as deleteEntryRoute,
  PATCH as updateEntryRoute,
} from "@/app/api/v1/entries/[entryId]/route";
import { POST as createEntryRoute, GET as listEntriesRoute } from "@/app/api/v1/entries/route";
import { toBase64 } from "@/crypto/base64";
import {
  AES_GCM_AUTH_TAG_BYTES,
  AES_GCM_IV_BYTES,
  AES_KW_WRAPPED_KEY_BYTES,
} from "@/crypto/encrypt.constants";
import { AUTH_ERROR_CODES } from "@/lib/api/auth/auth.error";
import type {
  ApiCreateAccountRequest,
  ApiSaltRequest,
  ApiVerifyCredentialsRequest,
} from "@/lib/api/auth/auth.type";
import { CURRENT_AUTH_KEY_SCHEDULE } from "@/lib/api/auth/auth-key-schedule";
import { JOURNAL_ENTRY_ENCRYPTION_VERSION } from "@/lib/api/journal/journal.constants";
import { JOURNAL_ERROR_CODES } from "@/lib/api/journal/journal.error";
import type {
  ApiCreateJournalEntryRequest,
  ApiUpdateJournalEntryRequest,
  EncryptedJournalData,
  EncryptedJournalEntry,
} from "@/lib/api/journal/journal.type";
import { REQUEST_ERROR_CODES } from "@/lib/api/request.error";

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
  getSessionUserId: vi.fn(),
  startSession: vi.fn(),
}));
const environmentMocks = vi.hoisted(() => ({
  getServerEnvironment: vi.fn(() => ({ nodeEnvironment: "test" })),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/server/auth/auth", () => authMocks);
vi.mock("@/server/auth/session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/auth/session")>()),
  endSession: sessionMocks.endSession,
  getSessionUserId: sessionMocks.getSessionUserId,
  startSession: sessionMocks.startSession,
}));
vi.mock("@/server/environment", () => environmentMocks);
vi.mock("@/server/journal/journal", () => journalMocks);

const ORIGIN = "https://blind-journal.test";
const CROSS_ORIGIN = "https://attacker.test";
const USER_ID = "00000000-0000-4000-8000-000000000001";
const ENTRY_ID = "00000000-0000-4000-8000-000000000002";
const USER = { id: USER_ID, username: "journal.user", displayName: "Journal.User" };
const AUTH_KEY = toBase64(
  new Uint8Array(CURRENT_AUTH_KEY_SCHEDULE.authenticationKey.outputLengthBytes),
);
const ACCOUNT_SALT = toBase64(
  new Uint8Array(CURRENT_AUTH_KEY_SCHEDULE.passwordKdf.saltLengthBytes),
);
const CREATE_ACCOUNT_BODY = {
  username: USER.username,
  authKey: AUTH_KEY,
  keyScheduleVersion: CURRENT_AUTH_KEY_SCHEDULE.version,
  salt: ACCOUNT_SALT,
} satisfies ApiCreateAccountRequest;
const LOGIN_BODY = {
  username: USER.username,
  authKey: AUTH_KEY,
  keyScheduleVersion: CURRENT_AUTH_KEY_SCHEDULE.version,
} satisfies ApiVerifyCredentialsRequest;
const SALT_BODY = { username: USER.username } satisfies ApiSaltRequest;

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

function encryptedData(): EncryptedJournalData {
  return {
    version: JOURNAL_ENTRY_ENCRYPTION_VERSION,
    wrappedKeyBase64: toBase64(new Uint8Array(AES_KW_WRAPPED_KEY_BYTES)),
    ciphertextBase64: toBase64(new Uint8Array(AES_GCM_AUTH_TAG_BYTES)),
    ivBase64: toBase64(new Uint8Array(AES_GCM_IV_BYTES)),
  };
}

function entryContext(entryId = ENTRY_ID) {
  return { params: Promise.resolve({ entryId }) };
}

function createEntryBody(): ApiCreateJournalEntryRequest {
  return { id: ENTRY_ID, encryptedData: encryptedData() };
}

function encryptedEntry(): EncryptedJournalEntry {
  return {
    ...createEntryBody(),
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("authentication Route Handlers", () => {
  it("passes the previous cookie to account creation and writes the returned session", async () => {
    authMocks.createAccount.mockResolvedValue({
      success: true,
      data: { apiSession: { user: USER }, sessionId: "new-session-id" },
    });

    const response = await createAccountRoute(
      jsonRequest("/api/v1/auth/accounts", CREATE_ACCOUNT_BODY, {
        cookie: "__Host-blind-journal-session=previous-session-id",
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ user: USER });
    expect(authMocks.createAccount).toHaveBeenCalledWith(
      CREATE_ACCOUNT_BODY,
      "previous-session-id",
    );
    const setCookies = response.headers.getSetCookie();
    expect(setCookies).toHaveLength(1);
    expect(setCookies[0]).toContain("__Host-blind-journal-session=new-session-id");
    expect(setCookies[0]).not.toContain("previous-session-id");
  });

  it("returns the salt service result", async () => {
    const data = {
      keyScheduleVersion: CURRENT_AUTH_KEY_SCHEDULE.version,
      salt: ACCOUNT_SALT,
    };
    authMocks.getAuthSalt.mockResolvedValue({ success: true, data });

    const response = await saltRoute(jsonRequest("/api/v1/auth/salt", SALT_BODY));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(data);
    expect(authMocks.getAuthSalt).toHaveBeenCalledExactlyOnceWith(SALT_BODY);
  });

  it("starts a session only after successful credential verification", async () => {
    authMocks.verifyCredentials.mockResolvedValue({ success: true, data: { user: USER } });
    const request = jsonRequest("/api/v1/auth/login", LOGIN_BODY);

    const response = await loginRoute(request);

    expect(response.status).toBe(200);
    await expect(response.clone().json()).resolves.toEqual({ user: USER });
    expect(authMocks.verifyCredentials).toHaveBeenCalledExactlyOnceWith(LOGIN_BODY);
    expect(sessionMocks.startSession).toHaveBeenCalledExactlyOnceWith(request, response, USER_ID);
  });

  it("ends the current session on logout", async () => {
    const request = routeRequest("/api/v1/auth/logout", { origin: ORIGIN });

    const response = await logoutRoute(request);

    expect(response.status).toBe(200);
    await expect(response.clone().json()).resolves.toBeNull();
    expect(sessionMocks.endSession).toHaveBeenCalledExactlyOnceWith(request, response);
  });

  it.each([
    [
      "a missing body",
      () =>
        routeRequest("/api/v1/auth/accounts", {
          contentType: "application/json",
          origin: ORIGIN,
        }),
      REQUEST_ERROR_CODES.invalid,
      400,
    ],
    [
      "malformed JSON",
      () =>
        routeRequest("/api/v1/auth/accounts", {
          body: "{",
          contentType: "application/json",
          origin: ORIGIN,
        }),
      REQUEST_ERROR_CODES.invalid,
      400,
    ],
    [
      "an unsupported media type",
      () =>
        routeRequest("/api/v1/auth/accounts", {
          body: "account",
          contentType: "text/plain",
          origin: ORIGIN,
        }),
      REQUEST_ERROR_CODES.unsupportedMediaType,
      415,
    ],
    [
      "an oversized body",
      () =>
        routeRequest("/api/v1/auth/accounts", {
          body: "x".repeat(1_025),
          contentType: "application/json",
          origin: ORIGIN,
        }),
      REQUEST_ERROR_CODES.payloadTooLarge,
      413,
    ],
  ] as const)("rejects %s before account creation", async (_case, request, code, status) => {
    const response = await createAccountRoute(request());

    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toEqual({ code });
    expect(authMocks.createAccount).not.toHaveBeenCalled();
  });

  it("maps authentication service failures without starting a session", async () => {
    authMocks.verifyCredentials.mockResolvedValue({
      success: false,
      error: { code: AUTH_ERROR_CODES.invalidCredentials },
    });

    const response = await loginRoute(jsonRequest("/api/v1/auth/login", LOGIN_BODY));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ code: AUTH_ERROR_CODES.invalidCredentials });
    expect(sessionMocks.startSession).not.toHaveBeenCalled();
  });
});

describe("mutation origin boundary", () => {
  it.each([
    [
      "account creation",
      () =>
        createAccountRoute(
          jsonRequest("/api/v1/auth/accounts", CREATE_ACCOUNT_BODY, { origin: CROSS_ORIGIN }),
        ),
      authMocks.createAccount,
    ],
    [
      "salt lookup",
      () => saltRoute(jsonRequest("/api/v1/auth/salt", SALT_BODY, { origin: CROSS_ORIGIN })),
      authMocks.getAuthSalt,
    ],
    [
      "login",
      () => loginRoute(jsonRequest("/api/v1/auth/login", LOGIN_BODY, { origin: CROSS_ORIGIN })),
      authMocks.verifyCredentials,
    ],
    [
      "logout",
      () => logoutRoute(routeRequest("/api/v1/auth/logout", { origin: CROSS_ORIGIN })),
      sessionMocks.endSession,
    ],
    [
      "entry creation",
      () =>
        createEntryRoute(
          jsonRequest("/api/v1/entries", createEntryBody(), { origin: CROSS_ORIGIN }),
        ),
      journalMocks.createEntry,
    ],
    [
      "entry update",
      () =>
        updateEntryRoute(
          jsonRequest(
            `/api/v1/entries/${ENTRY_ID}`,
            { encryptedData: encryptedData() },
            {
              origin: CROSS_ORIGIN,
            },
          ),
          entryContext(),
        ),
      journalMocks.updateEntry,
    ],
    [
      "entry deletion",
      () =>
        deleteEntryRoute(
          routeRequest(`/api/v1/entries/${ENTRY_ID}`, {
            method: "DELETE",
            origin: CROSS_ORIGIN,
          }),
          entryContext(),
        ),
      journalMocks.deleteEntry,
    ],
  ] as const)("rejects cross-origin %s before domain work", async (_case, invoke, domainCall) => {
    const response = await invoke();

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ code: REQUEST_ERROR_CODES.forbidden });
    expect(sessionMocks.getSessionUserId).not.toHaveBeenCalled();
    expect(domainCall).not.toHaveBeenCalled();
  });
});

describe("journal Route Handlers", () => {
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

  it.each([
    [
      "creation",
      () =>
        createEntryRoute(
          routeRequest("/api/v1/entries", {
            body: "{",
            contentType: "application/json",
            origin: ORIGIN,
          }),
        ),
      journalMocks.createEntry,
    ],
    [
      "update",
      () =>
        updateEntryRoute(
          routeRequest(`/api/v1/entries/${ENTRY_ID}`, {
            body: "{",
            contentType: "application/json",
            origin: ORIGIN,
          }),
          entryContext(),
        ),
      journalMocks.updateEntry,
    ],
    [
      "deletion",
      () =>
        deleteEntryRoute(
          routeRequest(`/api/v1/entries/${ENTRY_ID}`, { method: "DELETE", origin: ORIGIN }),
          entryContext(),
        ),
      journalMocks.deleteEntry,
    ],
  ] as const)(
    "rejects unauthenticated entry %s before domain work",
    async (_case, invoke, call) => {
      sessionMocks.getSessionUserId.mockResolvedValue(null);

      const response = await invoke();

      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual({ code: AUTH_ERROR_CODES.unauthorized });
      expect(call).not.toHaveBeenCalled();
    },
  );

  it("passes an authenticated create request to the journal domain", async () => {
    const body = createEntryBody();
    const entry = encryptedEntry();
    sessionMocks.getSessionUserId.mockResolvedValue(USER_ID);
    journalMocks.createEntry.mockResolvedValue({ success: true, data: entry });

    const response = await createEntryRoute(jsonRequest("/api/v1/entries", body));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual(entry);
    expect(journalMocks.createEntry).toHaveBeenCalledExactlyOnceWith(USER_ID, body);
  });

  it("passes an authenticated update request to the journal domain", async () => {
    const body = { encryptedData: encryptedData() } satisfies ApiUpdateJournalEntryRequest;
    const entry = encryptedEntry();
    sessionMocks.getSessionUserId.mockResolvedValue(USER_ID);
    journalMocks.updateEntry.mockResolvedValue({ success: true, data: entry });

    const response = await updateEntryRoute(
      jsonRequest(`/api/v1/entries/${ENTRY_ID}`, body),
      entryContext(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(entry);
    expect(journalMocks.updateEntry).toHaveBeenCalledExactlyOnceWith(USER_ID, ENTRY_ID, body);
  });

  it("passes an authenticated deletion to the journal domain", async () => {
    const data = { id: ENTRY_ID };
    sessionMocks.getSessionUserId.mockResolvedValue(USER_ID);
    journalMocks.deleteEntry.mockResolvedValue({ success: true, data });

    const response = await deleteEntryRoute(
      routeRequest(`/api/v1/entries/${ENTRY_ID}`, { method: "DELETE", origin: ORIGIN }),
      entryContext(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(data);
    expect(journalMocks.deleteEntry).toHaveBeenCalledExactlyOnceWith(USER_ID, ENTRY_ID);
  });

  it("maps journal service failures to the public API response", async () => {
    sessionMocks.getSessionUserId.mockResolvedValue(USER_ID);
    journalMocks.createEntry.mockResolvedValue({
      success: false,
      error: { code: JOURNAL_ERROR_CODES.entryAlreadyExists },
    });

    const response = await createEntryRoute(jsonRequest("/api/v1/entries", createEntryBody()));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      code: JOURNAL_ERROR_CODES.entryAlreadyExists,
    });
  });

  it("hides malformed entry identifiers behind the not-found response", async () => {
    sessionMocks.getSessionUserId.mockResolvedValue(USER_ID);
    const context = entryContext("not-a-uuid");

    const updateResponse = await updateEntryRoute(
      jsonRequest("/api/v1/entries/not-a-uuid", {
        encryptedData: encryptedData(),
      } satisfies ApiUpdateJournalEntryRequest),
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
