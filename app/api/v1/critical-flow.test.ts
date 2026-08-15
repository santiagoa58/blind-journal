import { QueryClient } from "@tanstack/react-query";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AUTH_ERROR_CODES } from "@/api/auth/auth.error";
import { CURRENT_AUTH_KEY_SCHEDULE } from "@/api/auth/auth-key-schedule";
import { JOURNAL_ENTRIES_PAGE_SIZE } from "@/api/journal/journal.constants";
import { JOURNAL_ERROR_CODES } from "@/api/journal/journal.error";
import type { ApiCreateJournalEntryRequest } from "@/api/journal/journal.type";
import { REQUEST_ERROR_CODES } from "@/api/request.error";
import { POST as createAccount } from "@/app/api/v1/auth/accounts/route";
import { POST as login } from "@/app/api/v1/auth/login/route";
import { POST as logout } from "@/app/api/v1/auth/logout/route";
import { POST as getAuthSalt } from "@/app/api/v1/auth/salt/route";
import { DELETE as deleteEntry, PATCH as updateEntry } from "@/app/api/v1/entries/[entryId]/route";
import { POST as createEntry, GET as listEntries } from "@/app/api/v1/entries/route";
import { journalEntriesQueryKey } from "@/components/journal/journal-query";
import { toBase64 } from "@/crypto/base64";
import { createJournalService } from "@/server/journal.service";
import { serverStore } from "@/server/store";
import type { ApplicationStore } from "@/server/store.type";

vi.mock("server-only", () => ({}));

const ORIGIN = "https://blind-journal.test";
const AUTH_KEY = toBase64(new Uint8Array(32).fill(1));
const OTHER_AUTH_KEY = toBase64(new Uint8Array(32).fill(2));

type RequestOptions = {
  body?: string;
  contentType?: string;
  cookie?: string;
  method?: string;
  origin?: string;
};

function routeRequest(path: string, options: RequestOptions = {}): NextRequest {
  const headers = new Headers();
  if (options.origin) {
    headers.set("Origin", options.origin);
  }
  if (options.cookie) {
    headers.set("Cookie", options.cookie);
  }
  if (options.contentType) {
    headers.set("Content-Type", options.contentType);
  }

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

function getSessionCookie(response: Response): string {
  const setCookie = response.headers.get("set-cookie");
  if (!setCookie) {
    throw new Error("The authentication response did not set a session cookie.");
  }
  const cookie = setCookie.split(";", 1)[0];
  if (!cookie) {
    throw new Error("The session cookie was malformed.");
  }
  return cookie;
}

async function register(username: string, authKey = AUTH_KEY) {
  const saltResponse = await getAuthSalt(jsonRequest("/api/v1/auth/salt", { username }));
  expect(saltResponse.status).toBe(200);
  const saltData = await saltResponse.json();

  const response = await createAccount(
    jsonRequest("/api/v1/auth/accounts", {
      username,
      authKey,
      keyScheduleVersion: saltData.keyScheduleVersion,
      salt: saltData.salt,
    }),
  );
  expect(response.status).toBe(201);

  return {
    cookie: getSessionCookie(response),
    data: await response.json(),
    salt: saltData.salt,
  };
}

function encryptedEntry(id: string, marker: number): ApiCreateJournalEntryRequest {
  return {
    id,
    encryptedData: {
      version: 1,
      wrappedKeyBase64: toBase64(new Uint8Array(40).fill(marker)),
      ciphertextBase64: toBase64(new Uint8Array(32).fill(marker)),
      ivBase64: toBase64(new Uint8Array(12).fill(marker)),
    },
  };
}

function resetStore(): void {
  serverStore.entriesByUserId.clear();
  serverStore.sessions.clear();
  serverStore.users.length = 0;
}

function createRejectingJournalStore(): ApplicationStore {
  return {
    createUser: () => false,
    deleteJournalEntry: () => false,
    findUserById: () => undefined,
    findUserByUsername: () => undefined,
    getJournalEntries: () => [],
    getJournalEntriesPage: () => ({ entries: [], nextCursor: null }),
    insertJournalEntry: () => false,
    replaceJournalEntry: () => false,
  };
}

beforeEach(resetStore);
afterEach(resetStore);

describe("critical authentication routes", () => {
  it("registers and authenticates an account while keeping credential failures generic", async () => {
    const registration = await register("  Journal.User  ");

    expect(registration.data).toMatchObject({
      user: {
        username: "journal.user",
        displayName: "Journal.User",
      },
    });

    const unknownSalt = await getAuthSalt(
      jsonRequest("/api/v1/auth/salt", { username: "unknown-user" }),
    );
    const wrongCredentials = await login(
      jsonRequest("/api/v1/auth/login", {
        username: "journal.user",
        authKey: OTHER_AUTH_KEY,
        keyScheduleVersion: CURRENT_AUTH_KEY_SCHEDULE.version,
      }),
    );

    expect(unknownSalt.status).toBe(200);
    expect(wrongCredentials.status).toBe(401);
    await expect(unknownSalt.json()).resolves.toEqual({
      keyScheduleVersion: CURRENT_AUTH_KEY_SCHEDULE.version,
      salt: expect.any(String),
    });
    await expect(wrongCredentials.json()).resolves.toEqual({
      code: AUTH_ERROR_CODES.invalidCredentials,
    });

    const saltResponse = await getAuthSalt(
      jsonRequest("/api/v1/auth/salt", { username: "JOURNAL.USER" }),
    );
    const loginResponse = await login(
      jsonRequest("/api/v1/auth/login", {
        username: "JOURNAL.USER",
        authKey: AUTH_KEY,
        keyScheduleVersion: CURRENT_AUTH_KEY_SCHEDULE.version,
      }),
    );

    expect(saltResponse.status).toBe(200);
    expect(loginResponse.status).toBe(200);
    expect(getSessionCookie(loginResponse)).toContain("=");
  });

  it("returns stable decoy metadata for unknown usernames without exposing account existence", async () => {
    const firstUnknownResponse = await getAuthSalt(
      jsonRequest("/api/v1/auth/salt", { username: "Unknown.User" }),
    );
    const normalizedUnknownResponse = await getAuthSalt(
      jsonRequest("/api/v1/auth/salt", { username: "unknown.user" }),
    );
    const differentUnknownResponse = await getAuthSalt(
      jsonRequest("/api/v1/auth/salt", { username: "another-user" }),
    );

    expect(firstUnknownResponse.status).toBe(200);
    expect(normalizedUnknownResponse.status).toBe(200);
    expect(differentUnknownResponse.status).toBe(200);

    const firstUnknown = await firstUnknownResponse.json();
    const normalizedUnknown = await normalizedUnknownResponse.json();
    const differentUnknown = await differentUnknownResponse.json();

    expect(firstUnknown).toEqual(normalizedUnknown);
    expect(firstUnknown).not.toEqual(differentUnknown);
    expect(firstUnknown).toMatchObject({
      keyScheduleVersion: CURRENT_AUTH_KEY_SCHEDULE.version,
      salt: expect.any(String),
    });

    const repeatedSaltResponse = await getAuthSalt(
      jsonRequest("/api/v1/auth/salt", { username: "unknown.user" }),
    );
    await expect(repeatedSaltResponse.json()).resolves.toEqual(firstUnknown);
  });

  it("keeps registration stateless and returns generic failures for existing usernames", async () => {
    await register("existing-user");

    const saltResponse = await getAuthSalt(
      jsonRequest("/api/v1/auth/salt", { username: "EXISTING-USER" }),
    );
    expect(saltResponse.status).toBe(200);
    const saltData = await saltResponse.json();

    const duplicateResponse = await createAccount(
      jsonRequest("/api/v1/auth/accounts", {
        username: "EXISTING-USER",
        authKey: OTHER_AUTH_KEY,
        keyScheduleVersion: saltData.keyScheduleVersion,
        salt: saltData.salt,
      }),
    );

    expect(duplicateResponse.status).toBe(401);
    await expect(duplicateResponse.json()).resolves.toEqual({
      code: AUTH_ERROR_CODES.invalidCredentials,
    });
  });

  it("creates only one account when duplicate registrations arrive concurrently", async () => {
    const username = "concurrent-user";
    const saltResponse = await getAuthSalt(jsonRequest("/api/v1/auth/salt", { username }));
    const saltData = await saltResponse.json();
    const registration = () =>
      createAccount(
        jsonRequest("/api/v1/auth/accounts", {
          username,
          authKey: AUTH_KEY,
          keyScheduleVersion: saltData.keyScheduleVersion,
          salt: saltData.salt,
        }),
      );

    const responses = await Promise.all([registration(), registration()]);

    expect(responses.map(({ status }) => status).toSorted()).toEqual([201, 401]);
    expect(serverStore.users).toHaveLength(1);
    expect(serverStore.entriesByUserId.size).toBe(1);
  });

  it("stores the verified registration salt only when the account is completed", async () => {
    const firstSaltResponse = await getAuthSalt(
      jsonRequest("/api/v1/auth/salt", { username: "stateless-user" }),
    );
    const secondSaltResponse = await getAuthSalt(
      jsonRequest("/api/v1/auth/salt", { username: "stateless-user" }),
    );
    const firstSalt = await firstSaltResponse.json();
    const secondSalt = await secondSaltResponse.json();

    expect(firstSalt).toEqual(secondSalt);
    expect(serverStore.users).toHaveLength(0);

    const accountResponse = await createAccount(
      jsonRequest("/api/v1/auth/accounts", {
        username: "stateless-user",
        authKey: AUTH_KEY,
        keyScheduleVersion: secondSalt.keyScheduleVersion,
        salt: secondSalt.salt,
      }),
    );

    expect(accountResponse.status).toBe(201);
    expect(serverStore.users).toHaveLength(1);
    expect(serverStore.users[0]?.salt).toBe(secondSalt.salt);
  });

  it("rejects substituted registration salts without creating a partial account", async () => {
    const saltResponse = await getAuthSalt(
      jsonRequest("/api/v1/auth/salt", { username: "tampered-salt-user" }),
    );
    const saltData = await saltResponse.json();

    const response = await createAccount(
      jsonRequest("/api/v1/auth/accounts", {
        username: "tampered-salt-user",
        authKey: AUTH_KEY,
        keyScheduleVersion: saltData.keyScheduleVersion,
        salt: toBase64(new Uint8Array(16).fill(9)),
      }),
    );

    expect(response.status).toBe(401);
    expect(serverStore.users).toHaveLength(0);
    await expect(response.json()).resolves.toEqual({
      code: AUTH_ERROR_CODES.invalidCredentials,
    });
  });

  it("rejects cross-origin and malformed salt requests at the route boundary", async () => {
    const crossOriginResponse = await getAuthSalt(
      jsonRequest(
        "/api/v1/auth/salt",
        { username: "journal-user" },
        { origin: "https://attacker.test" },
      ),
    );
    const malformedResponse = await getAuthSalt(
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
  });

  it("expires and removes stale sessions", async () => {
    const { cookie } = await register("session-user");
    const [sessionId, session] = serverStore.sessions.entries().next().value ?? [];
    if (!sessionId || !session) {
      throw new Error("Registration did not persist a session.");
    }
    session.expiresAt = Date.now() - 1;

    const response = listEntries(routeRequest("/api/v1/entries", { method: "GET", cookie }));

    expect(response.status).toBe(401);
    expect(serverStore.sessions.has(sessionId)).toBe(false);
    await expect(response.json()).resolves.toEqual({ code: AUTH_ERROR_CODES.unauthorized });
  });

  it("revokes the server session and clears its cookie on logout", async () => {
    const { cookie } = await register("logout-user");

    const response = logout(routeRequest("/api/v1/auth/logout", { cookie, origin: ORIGIN }));
    const entriesResponse = listEntries(routeRequest("/api/v1/entries", { method: "GET", cookie }));

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(serverStore.sessions.size).toBe(0);
    expect(entriesResponse.status).toBe(401);
  });
});

describe("critical journal routes", () => {
  it("isolates entries by session owner and preserves create, update, and delete semantics", async () => {
    const firstUser = await register("first-user", AUTH_KEY);
    const secondUser = await register("second-user", OTHER_AUTH_KEY);
    const entryId = crypto.randomUUID();
    const initialEntry = encryptedEntry(entryId, 1);
    const replacementEntry = encryptedEntry(entryId, 2);

    const created = await createEntry(
      jsonRequest("/api/v1/entries", initialEntry, { cookie: firstUser.cookie }),
    );
    const duplicate = await createEntry(
      jsonRequest("/api/v1/entries", replacementEntry, { cookie: firstUser.cookie }),
    );
    const firstUserEntries = listEntries(
      routeRequest("/api/v1/entries", { method: "GET", cookie: firstUser.cookie }),
    );
    const secondUserEntries = listEntries(
      routeRequest("/api/v1/entries", { method: "GET", cookie: secondUser.cookie }),
    );

    expect(created.status).toBe(201);
    expect(duplicate.status).toBe(409);
    await expect(duplicate.json()).resolves.toEqual({
      code: JOURNAL_ERROR_CODES.entryAlreadyExists,
    });
    await expect(firstUserEntries.json()).resolves.toMatchObject({ records: [initialEntry] });
    await expect(secondUserEntries.json()).resolves.toEqual({ records: [], nextCursor: null });

    const unauthorizedUpdate = await updateEntry(
      jsonRequest(
        `/api/v1/entries/${entryId}`,
        { encryptedData: replacementEntry.encryptedData },
        { cookie: secondUser.cookie },
      ),
      { params: Promise.resolve({ entryId }) },
    );
    const unauthorizedDelete = await deleteEntry(
      routeRequest(`/api/v1/entries/${entryId}`, {
        method: "DELETE",
        cookie: secondUser.cookie,
        origin: ORIGIN,
      }),
      { params: Promise.resolve({ entryId }) },
    );

    expect(unauthorizedUpdate.status).toBe(404);
    expect(unauthorizedDelete.status).toBe(404);

    const updated = await updateEntry(
      jsonRequest(
        `/api/v1/entries/${entryId}`,
        { encryptedData: replacementEntry.encryptedData },
        { cookie: firstUser.cookie },
      ),
      { params: Promise.resolve({ entryId }) },
    );
    expect(updated.status).toBe(200);
    await expect(updated.json()).resolves.toMatchObject(replacementEntry);

    const deleted = await deleteEntry(
      routeRequest(`/api/v1/entries/${entryId}`, {
        method: "DELETE",
        cookie: firstUser.cookie,
        origin: ORIGIN,
      }),
      { params: Promise.resolve({ entryId }) },
    );
    expect(deleted.status).toBe(200);

    const remainingEntries = listEntries(
      routeRequest("/api/v1/entries", { method: "GET", cookie: firstUser.cookie }),
    );
    await expect(remainingEntries.json()).resolves.toEqual({ records: [], nextCursor: null });
  });

  it("paginates entry responses with an opaque cursor and no overlap", async () => {
    const user = await register("pagination-user");
    const userId = (user.data as { user: { id: string } }).user.id;
    const entries = Array.from({ length: JOURNAL_ENTRIES_PAGE_SIZE + 2 }, (_, index) => ({
      ...encryptedEntry(`00000000-0000-4000-8000-${index.toString().padStart(12, "0")}`, index + 1),
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    }));
    serverStore.entriesByUserId.set(userId, entries);

    const firstResponse = listEntries(
      routeRequest("/api/v1/entries", { method: "GET", cookie: user.cookie }),
    );
    const firstPage = await firstResponse.json();
    const secondResponse = listEntries(
      routeRequest(`/api/v1/entries?cursor=${encodeURIComponent(firstPage.nextCursor)}`, {
        method: "GET",
        cookie: user.cookie,
      }),
    );
    const secondPage = await secondResponse.json();

    expect(firstResponse.status).toBe(200);
    expect(firstPage.records).toHaveLength(JOURNAL_ENTRIES_PAGE_SIZE);
    expect(firstPage.nextCursor).toEqual(expect.any(String));
    expect(secondResponse.status).toBe(200);
    expect(secondPage.records).toHaveLength(2);
    expect(secondPage.nextCursor).toBeNull();
    expect(new Set([...firstPage.records, ...secondPage.records].map(({ id }) => id)).size).toBe(
      entries.length,
    );
  });

  it("rejects an invalid journal page cursor", async () => {
    const user = await register("invalid-cursor-user");

    const response = listEntries(
      routeRequest("/api/v1/entries?cursor=bm90LWpzb24", {
        method: "GET",
        cookie: user.cookie,
      }),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({ code: JOURNAL_ERROR_CODES.invalidEntry });
  });

  it("reports an entry ID conflict when the atomic insert rejects a duplicate", () => {
    const service = createJournalService(createRejectingJournalStore());

    expect(service.createEntry("user-id", encryptedEntry(crypto.randomUUID(), 1))).toEqual({
      success: false,
      error: { code: JOURNAL_ERROR_CODES.entryAlreadyExists },
    });
  });

  it("does not swallow unexpected persistence exceptions", () => {
    const failure = new Error("The journal store is unavailable.");
    const store = createRejectingJournalStore();
    store.insertJournalEntry = () => {
      throw failure;
    };
    const service = createJournalService(store);

    expect(() => service.createEntry("user-id", encryptedEntry(crypto.randomUUID(), 1))).toThrow(
      failure,
    );
  });
});

describe("journal query cache isolation", () => {
  it("keeps decrypted entry lists scoped to the authenticated user ID", () => {
    const queryClient = new QueryClient();
    const firstUserKey = journalEntriesQueryKey("first-user-id");
    const secondUserKey = journalEntriesQueryKey("second-user-id");
    queryClient.setQueryData(firstUserKey, [{ id: "first-entry" }]);
    queryClient.setQueryData(secondUserKey, [{ id: "second-entry" }]);

    expect(queryClient.getQueryData(firstUserKey)).toEqual([{ id: "first-entry" }]);
    expect(queryClient.getQueryData(secondUserKey)).toEqual([{ id: "second-entry" }]);
    expect(firstUserKey).not.toEqual(secondUserKey);
  });
});
