export async function encrypt(encryptionKey: CryptoKey, rawData: Uint8Array<ArrayBuffer>) {
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
  let cipherText = "";
  for (const byte of new Uint8Array(buffer)) {
    cipherText += String.fromCharCode(byte);
  }
  const cipherTextBase64 = btoa(cipherText);

  return {
    cipherTextBase64,
    iv,
  };
}

export function generateEncryptionKey(){
    return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ])
}

export function wrapKey(key: CryptoKey, wrapperKey: CryptoKey) {
  return crypto.subtle.wrapKey("raw", key, wrapperKey, "AES-KW");
}
