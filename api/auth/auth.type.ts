import type { ApiUser } from "@/api/auth/user.type";
import type { Base64 } from "@/types/base64";

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
