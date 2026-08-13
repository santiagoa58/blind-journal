// Bounds identity input at every validation boundary without imposing a display-name policy.
export const MAX_USERNAME_LENGTH = 64;
// A minimum length favors memorable passphrases while still resisting trivial passwords.
export const MIN_PASSWORD_LENGTH = 15;
// Rejects impractically large input before the deliberately expensive password KDF runs.
export const MAX_PASSWORD_LENGTH = 128;
