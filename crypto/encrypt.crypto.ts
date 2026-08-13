import { toBase64 } from "@/crypto/base64";
import {
  AES_GCM_AUTH_TAG_BITS,
  AES_GCM_IV_BYTES,
  AES_KEY_LENGTH_BITS,
} from "@/crypto/encrypt.constants";
import type { Base64 } from "@/types/base64";

type EncryptedData = {
  ciphertextBase64: Base64;
  iv: Uint8Array<ArrayBuffer>;
};

export async function encrypt(
  encryptionKey: CryptoKey,
  rawData: Uint8Array<ArrayBuffer>,
  additionalData?: Uint8Array<ArrayBuffer>,
): Promise<EncryptedData> {
  // Generates a unique IV for every encryption. Never reuse an IV with the same key.
  const iv = crypto.getRandomValues(new Uint8Array(AES_GCM_IV_BYTES));
  const buffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
      additionalData,
      tagLength: AES_GCM_AUTH_TAG_BITS,
    },
    encryptionKey,
    rawData,
  );
  return {
    ciphertextBase64: toBase64(new Uint8Array(buffer)),
    iv,
  };
}

export function generateEncryptionKey() {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: AES_KEY_LENGTH_BITS }, true, [
    "encrypt",
    "decrypt",
  ]);
}

export async function wrapKey(key: CryptoKey, wrapperKey: CryptoKey): Promise<Base64> {
  const keyBuffer = await crypto.subtle.wrapKey("raw", key, wrapperKey, "AES-KW");
  return toBase64(new Uint8Array(keyBuffer));
}

export async function unwrapKey(
  key: Uint8Array<ArrayBuffer>,
  wrapperKey: CryptoKey,
): Promise<CryptoKey> {
  return crypto.subtle.unwrapKey(
    "raw",
    key,
    wrapperKey,
    "AES-KW",
    { name: "AES-GCM", length: AES_KEY_LENGTH_BITS },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function decrypt(
  encryptionKey: CryptoKey,
  ciphertext: Uint8Array<ArrayBuffer>,
  iv: Uint8Array<ArrayBuffer>,
  additionalData?: Uint8Array<ArrayBuffer>,
): Promise<ArrayBuffer> {
  return crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData,
      tagLength: AES_GCM_AUTH_TAG_BITS,
    },
    encryptionKey,
    ciphertext,
  );
}
