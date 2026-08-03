import "server-only";

import { randomBytes } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import { serverStore } from "@/server/store";

const SESSION_COOKIE_NAME = "blind-journal-session";
const SESSION_LIFETIME_SECONDS = 60 * 60 * 24;

export function startSession(response: NextResponse, userId: string): void {
  const sessionId = randomBytes(32).toString("base64url");

  serverStore.sessions.set(sessionId, {
    userId,
    expiresAt: Date.now() + SESSION_LIFETIME_SECONDS * 1_000,
  });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: sessionId,
    httpOnly: true,
    maxAge: SESSION_LIFETIME_SECONDS,
    path: "/",
    priority: "high",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export function getSessionUserId(request: NextRequest): string | null {
  const sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value;

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

export function endSession(request: NextRequest, response: NextResponse): void {
  const sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (sessionId) {
    serverStore.sessions.delete(sessionId);
  }

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    maxAge: 0,
    path: "/",
    priority: "high",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
