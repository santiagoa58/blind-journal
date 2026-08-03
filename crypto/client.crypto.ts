import sodium from "libsodium-wrappers-sumo";

export async function generateSalt(): Promise<[string, Uint8Array]> {
  await sodium.ready;
  const rawSalt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);
  const hexSalt = sodium.to_hex(rawSalt);
  return [hexSalt, rawSalt];
}
