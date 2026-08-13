// AES-256 uses a 256-bit key.
export const AES_KEY_LENGTH_BITS = 256;
// NIST recommends a 96-bit IV for AES-GCM. (96 bits = 12 bytes)
export const AES_GCM_IV_BYTES = 12;
// Uses AES-GCM's full 128-bit authentication tag rather than trading integrity margin for bytes.
export const AES_GCM_AUTH_TAG_BITS = 128;
