import sodium from "libsodium-wrappers-sumo";
import type { AuthUserKeys } from "@/api/auth/auth.type";
import type { AuthKeyScheduleVersion } from "@/api/auth/auth-key-schedule";
import { getAuthKeySchedule } from "@/api/auth/auth-key-schedule";
import { base64ToUint8Array, toBase64 } from "@/crypto/base64";
import type { Base64 } from "@/types/base64";

const BITS_PER_BYTE = 8;

function getPasswordKdfAlgorithm(algorithm: "argon2id13") {
  if (algorithm === "argon2id13") {
    return sodium.crypto_pwhash_ALG_ARGON2ID13;
  }

  throw new RangeError(`Unsupported password KDF algorithm: ${algorithm}`);
}

function deriveMasterKey(
  userPassword: string,
  salt: Uint8Array,
  keySchedule: ReturnType<typeof getAuthKeySchedule>,
) {
  if (salt.byteLength !== keySchedule.passwordKdf.saltLengthBytes) {
    throw new RangeError("The account salt has an invalid length.");
  }

  return sodium.crypto_pwhash(
    keySchedule.passwordKdf.outputLengthBytes,
    userPassword,
    salt,
    keySchedule.passwordKdf.operationsLimit,
    keySchedule.passwordKdf.memoryLimitBytes,
    getPasswordKdfAlgorithm(keySchedule.passwordKdf.algorithm),
  );
}

async function deriveUserKeys(
  rawMasterKey: Uint8Array,
  keySchedule: ReturnType<typeof getAuthKeySchedule>,
): Promise<AuthUserKeys> {
  const masterKey = await crypto.subtle.importKey(
    "raw",
    new Uint8Array(rawMasterKey),
    { name: keySchedule.keyDerivation.algorithm },
    false,
    ["deriveBits", "deriveKey"],
  );

  const authKey = await crypto.subtle.deriveBits(
    {
      name: keySchedule.keyDerivation.algorithm,
      hash: keySchedule.keyDerivation.hash,
      salt: new Uint8Array(keySchedule.keyDerivation.saltLengthBytes),
      info: new TextEncoder().encode(keySchedule.authenticationKey.context),
    },
    masterKey,
    keySchedule.authenticationKey.outputLengthBytes * BITS_PER_BYTE,
  );

  const keyEncryptionKey = await crypto.subtle.deriveKey(
    {
      name: keySchedule.keyDerivation.algorithm,
      hash: keySchedule.keyDerivation.hash,
      salt: new Uint8Array(keySchedule.keyDerivation.saltLengthBytes),
      info: new TextEncoder().encode(keySchedule.keyEncryptionKey.context),
    },
    masterKey,
    {
      name: keySchedule.keyEncryptionKey.algorithm,
      length: keySchedule.keyEncryptionKey.lengthBits,
    },
    false,
    ["wrapKey", "unwrapKey"],
  );

  return {
    authKey: toBase64(new Uint8Array(authKey)),
    keyEncryptionKey,
  };
}

export async function deriveAuthUserKeys(
  password: string,
  salt: Base64,
  keyScheduleVersion: AuthKeyScheduleVersion,
): Promise<AuthUserKeys> {
  await sodium.ready;

  const keySchedule = getAuthKeySchedule(keyScheduleVersion);
  const decodedSalt = base64ToUint8Array(salt);
  const masterKey = deriveMasterKey(password, decodedSalt, keySchedule);

  try {
    return await deriveUserKeys(masterKey, keySchedule);
  } finally {
    sodium.memzero(masterKey);
  }
}
