import "server-only";

import { randomBytes } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import { serverStore } from "@/server/store";

const DEVELOPMENT_SESSION_COOKIE_NAME = "blind-journal-session";
const PRODUCTION_SESSION_COOKIE_NAME = "__Host-blind-journal-session";
const SESSION_LIFETIME_SECONDS = 60 * 60 * 24;

function getSessionCookiePolicy() {
  const secure = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    name: secure ? PRODUCTION_SESSION_COOKIE_NAME : DEVELOPMENT_SESSION_COOKIE_NAME,
    path: "/",
    priority: "high",
    sameSite: "lax",
    secure,
  } as const;
}

export function startSession(response: NextResponse, userId: string): void {
  const sessionId = randomBytes(32).toString("base64url");

  // TODO(review-high-session-storage): Persist only a one-way hash of the bearer session ID in the
  // durable store, rotate/delete any prior session supplied on authentication, and provide bounded
  // expiry cleanup. A database disclosure currently yields immediately usable session tokens.
  serverStore.sessions.set(sessionId, {
    userId,
    expiresAt: Date.now() + SESSION_LIFETIME_SECONDS * 1_000,
  });
  response.cookies.set({
    ...getSessionCookiePolicy(),
    value: sessionId,
    maxAge: SESSION_LIFETIME_SECONDS,
  });
}

function getSessionUserIdFromSessionId(sessionId: string | undefined): string | null {
  if (!sessionId) {
    return null;
  }

  const session = serverStore.sessions.get(sessionId);

  if (!session || session.expiresAt <= Date.now()) {
    serverStore.sessions.delete(sessionId);
    return null;
  }

  return session.userId;
}

export function getSessionUserId(request: NextRequest): string | null {
  return getSessionUserIdFromSessionId(request.cookies.get(getSessionCookiePolicy().name)?.value);
}

export function endSession(request: NextRequest, response: NextResponse): void {
  const policy = getSessionCookiePolicy();
  const sessionId = request.cookies.get(policy.name)?.value;

  if (sessionId) {
    serverStore.sessions.delete(sessionId);
  }

  response.cookies.set({
    ...policy,
    value: "",
    maxAge: 0,
  });
}
