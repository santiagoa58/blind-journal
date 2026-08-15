import type { Base64, Base64Url } from "@/types/base64";

function bytesToBase64(data: Uint8Array): Base64 {
  let binary = "";

  for (const byte of data) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

export function base64ToUint8Array(data: Base64 | Base64Url): Uint8Array<ArrayBuffer> {
  const standardBase64 = data.replaceAll("-", "+").replaceAll("_", "/");
  return Uint8Array.from(atob(standardBase64), (character) => character.charCodeAt(0));
}

export function base64ToValue(data: Base64 | Base64Url): unknown {
  const json = new TextDecoder("utf-8", { fatal: true }).decode(base64ToUint8Array(data));
  return JSON.parse(json) as unknown;
}

export function toBase64(data: string | Uint8Array): Base64 {
  return bytesToBase64(typeof data === "string" ? new TextEncoder().encode(data) : data);
}

export function valueToBase64Url(value: unknown): Base64Url {
  const json = JSON.stringify(value);
  if (json === undefined) {
    throw new TypeError("Value is not JSON-serializable.");
  }

  return toBase64(json).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}
