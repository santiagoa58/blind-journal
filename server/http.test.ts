import { describe, expect, it, vi } from "vitest";
import { REQUEST_ERROR_CODES } from "@/api/request.error";
import { readJsonBody, requestErrorResponse } from "@/server/http";

vi.mock("server-only", () => ({}));

const REQUEST_URL = "https://blind-journal.test/api/v1/example";
const encoder = new TextEncoder();

function jsonRequest(body: string, contentType = "application/json") {
  return new Request(REQUEST_URL, {
    method: "POST",
    headers: { "Content-Type": contentType },
    body,
  });
}

type StreamingRequestOptions = {
  closeAfterChunks?: boolean;
  contentLength?: string;
};

function streamingJsonRequest(chunks: Uint8Array[], options: StreamingRequestOptions = {}) {
  const cancel = vi.fn();
  let chunkIndex = 0;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      const chunk = chunks[chunkIndex];
      if (chunk !== undefined) {
        controller.enqueue(chunk);
        chunkIndex += 1;
      }
      if (options.closeAfterChunks !== false && chunkIndex === chunks.length) {
        controller.close();
      }
    },
    cancel,
  });
  const headers = new Headers({ "Content-Type": "application/json" });
  if (options.contentLength !== undefined) {
    headers.set("Content-Length", options.contentLength);
  }
  const request = new Request(REQUEST_URL, {
    method: "POST",
    headers,
    body,
    duplex: "half",
  } as RequestInit & { duplex: "half" });

  return { cancel, request };
}

describe("JSON request bodies", () => {
  it("accepts valid JSON without applying domain validation", async () => {
    const request = jsonRequest(JSON.stringify({ journal: true }));

    await expect(readJsonBody(request, 1_024)).resolves.toEqual({
      data: { journal: true },
    });
  });

  it("accepts structured JSON media types", async () => {
    const request = jsonRequest(JSON.stringify({ journal: true }), "application/problem+json");

    await expect(readJsonBody(request, 1_024)).resolves.toEqual({
      data: { journal: true },
    });
  });

  it("classifies missing and malformed JSON as invalid requests", async () => {
    const missingBody = new Request(REQUEST_URL, { method: "POST" });
    const malformedBody = jsonRequest("{");

    await expect(readJsonBody(missingBody, 1_024)).resolves.toEqual({
      error: REQUEST_ERROR_CODES.invalid,
    });
    await expect(readJsonBody(malformedBody, 1_024)).resolves.toEqual({
      error: REQUEST_ERROR_CODES.invalid,
    });
  });

  it("distinguishes unsupported media types", async () => {
    const request = jsonRequest("journal", "text/plain");

    await expect(readJsonBody(request, 1_024)).resolves.toEqual({
      error: REQUEST_ERROR_CODES.unsupportedMediaType,
    });
  });

  it("distinguishes oversized payloads", async () => {
    const request = jsonRequest(JSON.stringify({ journal: "too large" }));

    await expect(readJsonBody(request, 4)).resolves.toEqual({
      error: REQUEST_ERROR_CODES.payloadTooLarge,
    });
  });

  it("accepts a streamed body at the exact byte limit", async () => {
    const bytes = encoder.encode(JSON.stringify({ journal: "é" }));
    const multibyteCharacterIndex = bytes.findIndex((byte) => byte > 0x7f);
    if (multibyteCharacterIndex === -1) {
      throw new Error("The streamed test fixture must contain a multibyte character");
    }
    const splitIndex = multibyteCharacterIndex + 1;
    const { request } = streamingJsonRequest([bytes.slice(0, splitIndex), bytes.slice(splitIndex)]);

    await expect(readJsonBody(request, bytes.byteLength)).resolves.toEqual({
      data: { journal: "é" },
    });
  });

  it("cancels a chunked body as soon as it exceeds the byte limit", async () => {
    const { cancel, request } = streamingJsonRequest([encoder.encode('{"journal":"too large"}')], {
      closeAfterChunks: false,
    });

    await expect(readJsonBody(request, 8)).resolves.toEqual({
      error: REQUEST_ERROR_CODES.payloadTooLarge,
    });
    expect(cancel).toHaveBeenCalledOnce();
  });

  it("does not trust a smaller declared content length", async () => {
    const { request } = streamingJsonRequest([encoder.encode('{"journal":"too large"}')], {
      contentLength: "2",
    });

    await expect(readJsonBody(request, 8)).resolves.toEqual({
      error: REQUEST_ERROR_CODES.payloadTooLarge,
    });
  });

  it("rejects a declared oversized body without consuming its stream", async () => {
    const { request } = streamingJsonRequest([encoder.encode("{}")], {
      contentLength: "9",
    });

    await expect(readJsonBody(request, 8)).resolves.toEqual({
      error: REQUEST_ERROR_CODES.payloadTooLarge,
    });
    expect(request.bodyUsed).toBe(false);
  });

  it("measures UTF-8 bytes rather than JavaScript string length", async () => {
    const body = JSON.stringify({ journal: "é" });
    const request = jsonRequest(body);

    await expect(readJsonBody(request, body.length)).resolves.toEqual({
      error: REQUEST_ERROR_CODES.payloadTooLarge,
    });
  });

  it("classifies invalid UTF-8 as an invalid request", async () => {
    const { request } = streamingJsonRequest([new Uint8Array([0xc3, 0x28])]);

    await expect(readJsonBody(request, 2)).resolves.toEqual({
      error: REQUEST_ERROR_CODES.invalid,
    });
  });
});

describe("request error responses", () => {
  it.each([
    [REQUEST_ERROR_CODES.invalid, 400],
    [REQUEST_ERROR_CODES.forbidden, 403],
    [REQUEST_ERROR_CODES.payloadTooLarge, 413],
    [REQUEST_ERROR_CODES.unsupportedMediaType, 415],
  ] as const)("maps %s to HTTP %i", async (code, expectedStatus) => {
    const response = requestErrorResponse(code);

    expect(response.status).toBe(expectedStatus);
    await expect(response.json()).resolves.toEqual({ code });
  });
});
