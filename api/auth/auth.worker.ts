/// <reference lib="webworker" />

import sodium from "libsodium-wrappers-sumo";
import type { AuthUserKeys, AuthWorkerPayload, AuthWorkerResponse } from "@/api/auth/auth.type";
import { base64ToUint8Array, uint8ArrayToBase64 } from "@/crypto/base64";
import { AES_KEY_LENGTH_BITS } from "@/crypto/encrypt.constants";

const HASH_KEY_LENGTH_BYTES = 32;
const BITS_PER_BYTE = 8;
const HASH_KEY_LENGTH_BITS = HASH_KEY_LENGTH_BYTES * BITS_PER_BYTE;
const AUTH_KEY_CONTEXT = "auth-key-context";
const ENCRYPTION_KEY_CONTEXT = "encrypt-key-context";

function deriveMasterKey(userPassword: string, salt: Uint8Array) {
  if (salt.byteLength !== sodium.crypto_pwhash_SALTBYTES) {
    throw new RangeError("The account salt has an invalid length.");
  }

  return sodium.crypto_pwhash(
    HASH_KEY_LENGTH_BYTES,
    userPassword,
    salt,
    sodium.crypto_pwhash_OPSLIMIT_SENSITIVE,
    sodium.crypto_pwhash_MEMLIMIT_SENSITIVE,
    sodium.crypto_pwhash_ALG_ARGON2ID13,
  );
}

async function deriveUserKeys(rawMasterKey: Uint8Array): Promise<AuthUserKeys> {
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
      salt: new Uint8Array(0),
      info: new TextEncoder().encode(AUTH_KEY_CONTEXT),
    },
    masterKey,
    HASH_KEY_LENGTH_BITS,
  );

  const keyEncryptionKey = await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(0),
      info: new TextEncoder().encode(ENCRYPTION_KEY_CONTEXT),
    },
    masterKey,
    { name: "AES-KW", length: AES_KEY_LENGTH_BITS },
    false,
    ["wrapKey", "unwrapKey"],
  );

  return {
    authKey: uint8ArrayToBase64(new Uint8Array(authKey)),
    keyEncryptionKey,
  };
}

self.addEventListener("message", async (event: MessageEvent<AuthWorkerPayload>) => {
  await sodium.ready;
  let masterKey: Uint8Array | undefined;

  try {
    const salt = base64ToUint8Array(event.data.salt);
    masterKey = deriveMasterKey(event.data.password, salt);
    const response = {
      requestId: event.data.requestId,
      data: await deriveUserKeys(masterKey),
    } satisfies AuthWorkerResponse;
    self.postMessage(response);
  } catch (error) {
    const response = {
      requestId: event.data.requestId,
      error: error instanceof Error ? error : new Error(String(error)),
    } satisfies AuthWorkerResponse;
    self.postMessage(response);
  } finally {
    if (masterKey) {
      sodium.memzero(masterKey);
    }
  }
});
