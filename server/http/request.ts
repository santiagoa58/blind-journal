import "server-only";

import { REQUEST_ERROR_CODES, type RequestErrorCode } from "@/lib/api/request.error";

const JSON_CONTENT_TYPE = "application/json";

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");

  return origin !== null && origin === new URL(request.url).origin;
}

type JsonBodyResult = { data: unknown } | { error: RequestErrorCode };

async function readTextBody(
  body: ReadableStream<Uint8Array<ArrayBuffer>>,
  maximumBytes: number,
): Promise<string | undefined> {
  const reader = body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let byteLength = 0;
  let text = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        return text + decoder.decode();
      }

      byteLength += value.byteLength;
      if (byteLength > maximumBytes) {
        await reader.cancel().catch(() => undefined);
        return undefined;
      }

      text += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}

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

  if (request.body === null) {
    return { error: REQUEST_ERROR_CODES.invalid };
  }

  try {
    const body = await readTextBody(request.body, maximumBytes);
    if (body === undefined) {
      return { error: REQUEST_ERROR_CODES.payloadTooLarge };
    }

    return { data: JSON.parse(body) as unknown };
  } catch {
    return { error: REQUEST_ERROR_CODES.invalid };
  }
}
