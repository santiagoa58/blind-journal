import "server-only";

import { createHash, randomBytes } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import {
  deleteSession,
  findSessionUserId,
  replaceSession,
  type StoredSession,
} from "@/server/database/sessions";
import { getServerEnvironment } from "@/server/environment";

const SESSION_ID_BYTES = 32;
const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const SESSION_LIFETIME_SECONDS = 60 * 60 * 24;

function getSessionCookiePolicy() {
  if (getServerEnvironment().nodeEnvironment === "development") {
    return {
      httpOnly: true,
      name: "blind-journal-session",
      path: "/",
      priority: "high",
      sameSite: "lax",
      secure: false,
    } as const;
  }

  return {
    httpOnly: true,
    name: "__Host-blind-journal-session",
    path: "/",
    priority: "high",
    sameSite: "lax",
    secure: true,
  } as const;
}

export function toSessionHash(sessionId: string | undefined): string | undefined {
  if (!sessionId || !SESSION_ID_PATTERN.test(sessionId)) {
    return undefined;
  }
  return createHash("sha256").update(sessionId, "utf8").digest("hex");
}

export function createSessionToken(userId: string): {
  session: StoredSession;
  sessionId: string;
} {
  const sessionId = randomBytes(SESSION_ID_BYTES).toString("base64url");
  const sessionHash = toSessionHash(sessionId);
  if (!sessionHash) {
    throw new Error("Failed to create a valid session token.");
  }

  const createdAt = new Date();
  return {
    sessionId,
    session: {
      userId,
      sessionHash,
      createdAt: createdAt.toISOString(),
      expiresAt: new Date(createdAt.valueOf() + SESSION_LIFETIME_SECONDS * 1_000).toISOString(),
    },
  };
}

export function getSessionCookieName(): string {
  return getSessionCookiePolicy().name;
}

export function setSessionCookie(response: NextResponse, sessionId: string): void {
  response.cookies.set({
    ...getSessionCookiePolicy(),
    value: sessionId,
    maxAge: SESSION_LIFETIME_SECONDS,
  });
}

export async function startSession(
  request: NextRequest,
  response: NextResponse,
  userId: string,
): Promise<void> {
  const previousSessionId = request.cookies.get(getSessionCookieName())?.value;
  const previousSessionHash = toSessionHash(previousSessionId);
  const { session, sessionId } = createSessionToken(userId);

  await replaceSession(session, previousSessionHash);
  setSessionCookie(response, sessionId);
}

export async function getSessionUserIdFromSessionId(
  sessionId: string | undefined,
): Promise<string | null> {
  const sessionHash = toSessionHash(sessionId);
  if (!sessionHash) {
    return null;
  }
  return (await findSessionUserId(sessionHash)) ?? null;
}

export function getSessionUserId(request: NextRequest): Promise<string | null> {
  return getSessionUserIdFromSessionId(request.cookies.get(getSessionCookieName())?.value);
}

export async function endSession(request: NextRequest, response: NextResponse): Promise<void> {
  const policy = getSessionCookiePolicy();
  const sessionId = request.cookies.get(policy.name)?.value;
  const sessionHash = toSessionHash(sessionId);

  if (sessionHash) {
    await deleteSession(sessionHash);
  }

  response.cookies.set({
    ...policy,
    value: "",
    maxAge: 0,
  });
}
