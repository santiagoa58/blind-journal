import type { Base64 } from "@/api/general.type";
import { uint8ArrayToBase64 } from "@/crypto/base64";

type EncryptedData = {
  cipherTextBase64: Base64;
  iv: Uint8Array<ArrayBuffer>;
};

export async function encrypt(
  encryptionKey: CryptoKey,
  rawData: Uint8Array<ArrayBuffer>,
): Promise<EncryptedData> {
  // Generates a unique 12-byte IV (Initialization Vector)
  // NEVER reuse the same IV with the same key!
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const buffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    encryptionKey,
    rawData,
  );
  return {
    cipherTextBase64: uint8ArrayToBase64(new Uint8Array(buffer)),
    iv,
  };
}

export function generateEncryptionKey() {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
}

export async function wrapKey(key: CryptoKey, wrapperKey: CryptoKey): Promise<Base64> {
  const keyBuffer = await crypto.subtle.wrapKey("raw", key, wrapperKey, "AES-KW");
  return uint8ArrayToBase64(new Uint8Array(keyBuffer));
}
