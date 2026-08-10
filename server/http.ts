import "server-only";

import { constants as HTTP_STATUS } from "node:http2";
import { NextResponse } from "next/server";

const JSON_CONTENT_TYPE = "application/json";

export function jsonResponse<T>(body: T, status = HTTP_STATUS.HTTP_STATUS_OK): NextResponse<T> {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");

  return origin !== null && origin === new URL(request.url).origin;
}

export async function readJsonBody(request: Request, maximumBytes: number): Promise<unknown> {
  const contentType = request.headers.get("content-type");

  if (!contentType?.toLowerCase().startsWith(JSON_CONTENT_TYPE)) {
    return null;
  }

  const contentLength = request.headers.get("content-length");

  if (contentLength !== null && Number(contentLength) > maximumBytes) {
    return null;
  }

  const body = await request.text();

  if (new TextEncoder().encode(body).byteLength > maximumBytes) {
    return null;
  }

  try {
    return JSON.parse(body) as unknown;
  } catch {
    return null;
  }
}
