import "server-only";

import { constants as HTTP_STATUS } from "node:http2";
import { NextResponse } from "next/server";
import { REQUEST_ERROR_CODES, type RequestErrorCode } from "@/api/request.error";
import { getRequestErrorHttpStatus } from "@/server/request.error";

const JSON_CONTENT_TYPE = "application/json";

// TODO(review-high-server-observability): Add centralized, redacted structured request/error
// reporting and correlation IDs here, then return the correlation ID (not diagnostic details) with
// code-only API errors. Unexpected failures currently fall through without an application-owned
// diagnostic trail.

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

export function requestErrorResponse(code: RequestErrorCode) {
  return jsonResponse({ code }, getRequestErrorHttpStatus(code));
}

type JsonBodyResult = { data: unknown } | { error: RequestErrorCode };

export async function readJsonBody(
  request: Request,
  maximumBytes: number,
): Promise<JsonBodyResult> {
  const contentType = request.headers.get("content-type");

  if (contentType === null) {
    return { error: REQUEST_ERROR_CODES.invalid };
  }

  const mediaType = contentType.split(";", 1)[0]?.trim().toLowerCase();

  if (mediaType !== JSON_CONTENT_TYPE && !mediaType?.endsWith("+json")) {
    return { error: REQUEST_ERROR_CODES.unsupportedMediaType };
  }

  const contentLength = request.headers.get("content-length");

  if (contentLength !== null && Number(contentLength) > maximumBytes) {
    return { error: REQUEST_ERROR_CODES.payloadTooLarge };
  }

  // TODO(review-high-streaming-body-limit): `request.text()` buffers an unbounded chunked body
  // before the byte check below. Enforce the limit while streaming (and at the deployment edge) so
  // a missing or dishonest Content-Length cannot exhaust a serverless function's memory.
  const body = await request.text();

  if (new TextEncoder().encode(body).byteLength > maximumBytes) {
    return { error: REQUEST_ERROR_CODES.payloadTooLarge };
  }

  try {
    return { data: JSON.parse(body) as unknown };
  } catch {
    return { error: REQUEST_ERROR_CODES.invalid };
  }
}
