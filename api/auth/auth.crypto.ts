import sodium from "libsodium-wrappers-sumo";

const HASH_KEY_LENGTH_BITS = 256; // Desired output length in bits (32 bytes * 8 bits/byte)
const HASH_KEY_LENGTH_BYTES = 32; // Desired output length in bytes (32 bytes is standard for keys)

export async function deriveMasterKey(userPassword: string, salt: Uint8Array) {
  await sodium.ready;

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

export async function deriveUserKeys(
  rawMasterKey: Uint8Array<ArrayBufferLike>,
) {
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

  const authKeyHex = sodium.to_hex(new Uint8Array(authKey));

  return {
    authKey: authKeyHex,
    keyEncryptKey: encryptKey,
  };
}
