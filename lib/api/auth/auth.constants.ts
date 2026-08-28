// Bounds identity input at every validation boundary without imposing a display-name policy.
export const MAX_USERNAME_LENGTH = 64;
export const USERNAME_PATTERN_SOURCE = "[A-Za-z0-9._\\-]+";
// Keep the hard requirement manageable while the UI encourages longer, memorable passphrases.
export const MIN_PASSWORD_LENGTH = 8;
// Rejects impractically large input before the deliberately expensive password KDF runs.
export const MAX_PASSWORD_LENGTH = 128;
