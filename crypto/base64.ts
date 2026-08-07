import type { Base64 } from "@/api/general.type";

export function uint8ArrayToBase64(data: Uint8Array): Base64 {
  let binary = "";

  for (const byte of data) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

export function base64ToUint8Array(data: Base64): Uint8Array {
  return Uint8Array.from(atob(data), (character) => character.charCodeAt(0));
}
