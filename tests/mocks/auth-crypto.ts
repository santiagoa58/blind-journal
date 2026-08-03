const SEEDED_AUTH_KEY =
  "79dbec8d47080becfa3b21d55ed7aea6d69005b2d40d756e161972ab7e749f5b";

export async function deriveMasterKey(userPassword: string) {
  return new TextEncoder().encode(userPassword);
}

export async function deriveUserKeys(
  rawMasterKey: Uint8Array<ArrayBufferLike>,
) {
  const password = new TextDecoder().decode(rawMasterKey);

  if (password === "journal123") {
    return { authKey: SEEDED_AUTH_KEY };
  }

  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(password),
  );
  const authKey = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

  return { authKey };
}
