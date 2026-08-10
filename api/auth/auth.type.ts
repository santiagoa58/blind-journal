import type { ApiUser } from "@/api/auth/user.type";
import type { Base64 } from "@/types/base64";

// TODO(encryption-protocol): Add versioned KDF parameters and a wrapped vault key to account
// registration and session-unlock responses. The server must persist only that wrapped key; the
// client should unwrap it with the password-derived key and discard the derivation key afterward.

export interface ApiAuthSession {
  user: ApiUser;
}

export interface ApiSaltRequest {
  username: string;
}
export type ApiSaltResponse = {
  salt: Base64;
};

export interface ApiVerifyCredentialsRequest {
  username: string;
  authKey: Base64;
}

export type ApiCreateAccountRequest = {
  username: string;
  authKey: Base64;
};

export interface ClientLoginRequest {
  username: string;
  password: string;
  salt: Base64;
}

export interface ClientCreateAccountRequest {
  username: string;
  password: string;
  confirmPassword: string;
}

export interface AuthWorkerPayload {
  requestId: string;
  password: string;
  salt: Base64;
}

export interface AuthUserKeys {
  authKey: Base64;
  keyEncryptionKey: CryptoKey;
}

export type AuthWorkerResponse =
  | {
      requestId: string;
      data: AuthUserKeys;
    }
  | {
      requestId: string;
      error: Error;
    };
