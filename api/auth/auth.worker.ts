/// <reference lib="webworker" />

import sodium from "libsodium-wrappers-sumo";
import { base64ToUint8Array, uint8ArrayToBase64 } from "@/crypto/base64";
import type { AuthUserKeys, AuthWorkerPayload, AuthWorkerResponse } from "./auth.type";

const HASH_KEY_LENGTH_BITS = 256; // Desired output length in bits (32 bytes * 8 bits/byte)
const HASH_KEY_LENGTH_BYTES = 32; // Desired output length in bytes (32 bytes is standard for keys)

function deriveMasterKey(userPassword: string, salt: Uint8Array) {
  if (salt.byteLength !== sodium.crypto_pwhash_SALTBYTES) {
    throw new Error("Invalid salt length");
  }
  // Hash the password with Argon2id and 'sensitive' parameters for better security
  return sodium.crypto_pwhash(
    HASH_KEY_LENGTH_BYTES,
    userPassword,
    salt,
    sodium.crypto_pwhash_OPSLIMIT_SENSITIVE,
    sodium.crypto_pwhash_MEMLIMIT_SENSITIVE,
    sodium.crypto_pwhash_ALG_ARGON2ID13, // Force Argon2id specifically
  );
}

async function deriveUserKeys(rawMasterKey: Uint8Array): Promise<AuthUserKeys> {
  // 2. Import Master Key into Web Crypto for HKDF
  const masterKey = await crypto.subtle.importKey(
    "raw",
    new Uint8Array(rawMasterKey),
    { name: "HKDF" },
    false,
    ["deriveBits", "deriveKey"],
  );

  const authKey = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(0), // No salt needed since masterKey is already very strong
      info: new TextEncoder().encode("auth-key-context"),
    },
    masterKey,
    HASH_KEY_LENGTH_BITS,
  );

  const encryptKey = await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(0), // No salt needed since masterKey is already very strong
      info: new TextEncoder().encode("encrypt-key-context"),
    },
    masterKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["wrapKey", "unwrapKey"],
  );

  return {
    authKey: uint8ArrayToBase64(new Uint8Array(authKey)),
    keyEncryptKey: encryptKey,
  };
}

self.addEventListener("message", async (e: MessageEvent<AuthWorkerPayload>) => {
  await sodium.ready;
  let salt: Uint8Array;
  let masterKey: Uint8Array | undefined;
  try {
    salt = base64ToUint8Array(e.data.salt);
    masterKey = deriveMasterKey(e.data.password, salt);
    const userKeys = await deriveUserKeys(masterKey);
    const response = {
      reqId: e.data.reqId,
      success: true,
      data: userKeys,
    } satisfies AuthWorkerResponse;
    self.postMessage(response);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const response = {
      reqId: e.data.reqId,
      success: false,
      error: msg,
    } satisfies AuthWorkerResponse;
    self.postMessage(response);
  } finally {
    masterKey && sodium.memzero(masterKey);
  }
});
