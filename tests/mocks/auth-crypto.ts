export async function deriveMasterKey(userPassword: string) {
  return new TextEncoder().encode(userPassword);
}

export async function deriveUserKeys(
  rawMasterKey: Uint8Array<ArrayBufferLike>,
) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new Uint8Array(rawMasterKey),
  );
  const authKey = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

  return { authKey };
}
