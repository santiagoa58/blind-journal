import { QueryClient } from "@tanstack/react-query";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AUTH_ERROR_CODES } from "@/api/auth/auth.error";
import { JOURNAL_ERROR_CODES } from "@/api/journal/journal.error";
import type { ApiCreateJournalEntryRequest } from "@/api/journal/journal.type";
import { REQUEST_ERROR_CODES } from "@/api/request.error";
import { POST as createAccount } from "@/app/api/v1/auth/accounts/route";
import { POST as createAccountSalt } from "@/app/api/v1/auth/accounts/salt/route";
import { POST as login } from "@/app/api/v1/auth/login/route";
import { POST as getLoginSalt } from "@/app/api/v1/auth/login/salt/route";
import { POST as logout } from "@/app/api/v1/auth/logout/route";
import { DELETE as deleteEntry, PATCH as updateEntry } from "@/app/api/v1/entries/[entryId]/route";
import { POST as createEntry, GET as listEntries } from "@/app/api/v1/entries/route";
import { journalEntriesQueryKey } from "@/components/journal/journal-query";
import { uint8ArrayToBase64 } from "@/crypto/base64";
import { createJournalService } from "@/server/journal.service";
import { serverStore } from "@/server/store";
import type { ApplicationStore } from "@/server/store.type";

vi.mock("server-only", () => ({}));

const ORIGIN = "https://blind-journal.test";
const AUTH_KEY = uint8ArrayToBase64(new Uint8Array(32).fill(1));
const OTHER_AUTH_KEY = uint8ArrayToBase64(new Uint8Array(32).fill(2));

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
  const saltResponse = await createAccountSalt(
    jsonRequest("/api/v1/auth/accounts/salt", { username }),
  );
  expect(saltResponse.status).toBe(201);

  const response = await createAccount(jsonRequest("/api/v1/auth/accounts", { username, authKey }));
  expect(response.status).toBe(201);

  return {
    cookie: getSessionCookie(response),
    data: await response.json(),
  };
}

function encryptedEntry(id: string, marker: number): ApiCreateJournalEntryRequest {
  return {
    id,
    encryptedData: {
      version: 1,
      wrappedKeyBase64: uint8ArrayToBase64(new Uint8Array(40).fill(marker)),
      ciphertextBase64: uint8ArrayToBase64(new Uint8Array(32).fill(marker)),
      ivBase64: uint8ArrayToBase64(new Uint8Array(12).fill(marker)),
    },
  };
}

function resetStore(): void {
  serverStore.entriesByUserId.clear();
  serverStore.pendingAccountSalts.clear();
  serverStore.sessions.clear();
  serverStore.users.length = 0;
}

function createRejectingJournalStore(): ApplicationStore {
  return {
    deleteJournalEntry: () => false,
    deletePendingAccountSalt: () => undefined,
    findUserById: () => undefined,
    findUserByUsername: () => undefined,
    getJournalEntries: () => [],
    getPendingAccountSalt: () => undefined,
    initializeJournal: () => undefined,
    insertJournalEntry: () => false,
    insertUser: () => undefined,
    replaceJournalEntry: () => false,
    setPendingAccountSalt: () => undefined,
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

    const unknownSalt = await getLoginSalt(
      jsonRequest("/api/v1/auth/login/salt", { username: "unknown-user" }),
    );
    const wrongCredentials = await login(
      jsonRequest("/api/v1/auth/login", {
        username: "journal.user",
        authKey: OTHER_AUTH_KEY,
      }),
    );

    expect(unknownSalt.status).toBe(401);
    expect(wrongCredentials.status).toBe(401);
    await expect(unknownSalt.json()).resolves.toEqual({
      code: AUTH_ERROR_CODES.invalidCredentials,
    });
    await expect(wrongCredentials.json()).resolves.toEqual({
      code: AUTH_ERROR_CODES.invalidCredentials,
    });

    const saltResponse = await getLoginSalt(
      jsonRequest("/api/v1/auth/login/salt", { username: "JOURNAL.USER" }),
    );
    const loginResponse = await login(
      jsonRequest("/api/v1/auth/login", {
        username: "JOURNAL.USER",
        authKey: AUTH_KEY,
      }),
    );

    expect(saltResponse.status).toBe(200);
    expect(loginResponse.status).toBe(200);
    expect(getSessionCookie(loginResponse)).toContain("=");
  });

  it("rejects cross-origin and malformed registration requests at the route boundary", async () => {
    const crossOriginResponse = await createAccountSalt(
      jsonRequest(
        "/api/v1/auth/accounts/salt",
        { username: "journal-user" },
        { origin: "https://attacker.test" },
      ),
    );
    const malformedResponse = await createAccountSalt(
      routeRequest("/api/v1/auth/accounts/salt", {
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
    expect(duplicate.status).toBe(422);
    await expect(duplicate.json()).resolves.toEqual({ code: JOURNAL_ERROR_CODES.invalidEntry });
    await expect(firstUserEntries.json()).resolves.toMatchObject([initialEntry]);
    await expect(secondUserEntries.json()).resolves.toEqual([]);

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
    await expect(remainingEntries.json()).resolves.toEqual([]);
  });

  it("does not report success when the persistence boundary rejects a write", () => {
    const service = createJournalService(createRejectingJournalStore());

    expect(service.createEntry("user-id", encryptedEntry(crypto.randomUUID(), 1))).toEqual({
      success: false,
      error: { code: JOURNAL_ERROR_CODES.invalidEntry },
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
