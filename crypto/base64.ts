import type { Base64 } from "@/types/base64";

function uint8ArrayToBase64(data: Uint8Array): Base64 {
  let binary = "";

  for (const byte of data) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

export function base64ToUint8Array(data: Base64): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(data), (character) => character.charCodeAt(0));
}

export function toBase64(data: string | Record<never, never> | Uint8Array, toBase64url = false): Base64 {
  const type = toBase64url ? "base64" : "base64url";
  if (typeof data === "string") {
    return Buffer.from(data).toString(type);
  }
  if (data instanceof Uint8Array) {
    return uint8ArrayToBase64(data);
  }
  return Buffer.from(JSON.stringify(data)).toString(type);
}
