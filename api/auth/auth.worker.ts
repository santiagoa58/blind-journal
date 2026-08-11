/// <reference lib="webworker" />

import sodium from "libsodium-wrappers-sumo";
import { AUTH_KEY_LENGTH_BYTES } from "@/api/auth/auth.constants";
import type { AuthUserKeys, AuthWorkerPayload, AuthWorkerResponse } from "@/api/auth/auth.type";
import { base64ToUint8Array, uint8ArrayToBase64 } from "@/crypto/base64";
import { AES_KEY_LENGTH_BITS } from "@/crypto/encrypt.constants";

const MASTER_KEY_LENGTH_BYTES = 32;
const BITS_PER_BYTE = 8;
const AUTH_KEY_LENGTH_BITS = AUTH_KEY_LENGTH_BYTES * BITS_PER_BYTE;
const AUTH_KEY_CONTEXT = "auth-key-context";
const ENCRYPTION_KEY_CONTEXT = "encrypt-key-context";

// TODO(review-high-key-schedule-version): Define a versioned account key schedule and persist its
// Argon2 algorithm, operations, memory, output length, and HKDF context version with the account.
// These hard-coded values are required to reproduce every user's authentication and wrapping key;
// changing any one of them currently makes existing accounts permanently inaccessible.

function deriveMasterKey(userPassword: string, salt: Uint8Array) {
  if (salt.byteLength !== sodium.crypto_pwhash_SALTBYTES) {
    throw new RangeError("The account salt has an invalid length.");
  }

  return sodium.crypto_pwhash(
    MASTER_KEY_LENGTH_BYTES,
    userPassword,
    salt,
    // TODO(review-high-browser-kdf-budget): Select and benchmark an explicit browser-safe Argon2id
    // policy. Libsodium's SENSITIVE profile can require roughly a GiB of memory, which can kill the
    // worker or fail on mobile devices; security parameters must be measurable and deployable.
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
    AUTH_KEY_LENGTH_BITS,
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

// TODO(review-high-auth-protocol-tests): Add compatibility vectors for the KDF/key schedule plus
// malformed-salt, wrong-password, worker-failure, and key-separation tests before treating this
// derivation protocol as production-stable.
self.addEventListener("message", async (event: MessageEvent<AuthWorkerPayload>) => {
  let masterKey: Uint8Array | undefined;

  try {
    await sodium.ready;
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
