import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { POST as createAccountRoute } from "@/app/api/v1/auth/accounts/route";
import {
  DELETE as deleteEntryRoute,
  PATCH as updateEntryRoute,
} from "@/app/api/v1/entries/[entryId]/route";
import { GET as listEntriesRoute } from "@/app/api/v1/entries/route";
import { toBase64 } from "@/crypto/base64";
import {
  AES_GCM_AUTH_TAG_BYTES,
  AES_GCM_IV_BYTES,
  AES_KW_WRAPPED_KEY_BYTES,
} from "@/crypto/encrypt.constants";
import { AUTH_ERROR_CODES } from "@/lib/api/auth/auth.error";
import type { ApiCreateAccountRequest } from "@/lib/api/auth/auth.type";
import { CURRENT_AUTH_KEY_SCHEDULE } from "@/lib/api/auth/auth-key-schedule";
import { JOURNAL_ENTRY_ENCRYPTION_VERSION } from "@/lib/api/journal/journal.constants";
import type {
  ApiUpdateJournalEntryRequest,
  EncryptedJournalData,
} from "@/lib/api/journal/journal.type";

const authMocks = vi.hoisted(() => ({
  createAccount: vi.fn(),
}));
const journalMocks = vi.hoisted(() => ({
  deleteEntry: vi.fn(),
  listEntries: vi.fn(),
  updateEntry: vi.fn(),
}));
const sessionMocks = vi.hoisted(() => ({
  getSessionUserId: vi.fn(),
}));
const environmentMocks = vi.hoisted(() => ({
  getServerEnvironment: vi.fn(() => ({ nodeEnvironment: "test" })),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/server/auth/auth", () => authMocks);
vi.mock("@/server/auth/session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/auth/session")>()),
  getSessionUserId: sessionMocks.getSessionUserId,
}));
vi.mock("@/server/environment", () => environmentMocks);
vi.mock("@/server/journal/journal", () => journalMocks);

const ORIGIN = "https://blind-journal.test";
const USER_ID = "00000000-0000-4000-8000-000000000001";
const USER = { id: USER_ID, username: "journal.user", displayName: "Journal.User" };
const AUTH_KEY = toBase64(
  new Uint8Array(CURRENT_AUTH_KEY_SCHEDULE.authenticationKey.outputLengthBytes),
);
const ACCOUNT_SALT = toBase64(
  new Uint8Array(CURRENT_AUTH_KEY_SCHEDULE.passwordKdf.saltLengthBytes),
);

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

describe("authentication Route Handlers", () => {
  it("passes the previous cookie to account creation and writes the returned session", async () => {
    authMocks.createAccount.mockResolvedValue({
      success: true,
      data: { apiSession: { user: USER }, sessionId: "new-session-id" },
    });
    const body = {
      username: USER.username,
      authKey: AUTH_KEY,
      keyScheduleVersion: CURRENT_AUTH_KEY_SCHEDULE.version,
      salt: ACCOUNT_SALT,
    } satisfies ApiCreateAccountRequest;

    const response = await createAccountRoute(
      jsonRequest("/api/v1/auth/accounts", body, {
        cookie: "__Host-blind-journal-session=previous-session-id",
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ user: USER });
    expect(authMocks.createAccount).toHaveBeenCalledWith(body, "previous-session-id");
    const setCookies = response.headers.getSetCookie();
    expect(setCookies).toHaveLength(1);
    expect(setCookies[0]).toContain("__Host-blind-journal-session=new-session-id");
    expect(setCookies[0]).not.toContain("previous-session-id");
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

  it("hides malformed entry identifiers behind the not-found response", async () => {
    sessionMocks.getSessionUserId.mockResolvedValue(USER_ID);
    const context = { params: Promise.resolve({ entryId: "not-a-uuid" }) };

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
