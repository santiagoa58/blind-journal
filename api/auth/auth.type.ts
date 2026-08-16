import type { AuthKeyScheduleVersion } from "@/api/auth/auth-key-schedule";
import type { ApiUser } from "@/api/auth/user.type";
import type { Base64 } from "@/types/base64";

export interface ApiAuthSession {
  user: ApiUser;
}

export interface ApiSaltRequest {
  username: string;
}
export type ApiSaltResponse = {
  keyScheduleVersion: AuthKeyScheduleVersion;
  salt: Base64;
};

export interface ApiVerifyCredentialsRequest {
  username: string;
  authKey: Base64;
  keyScheduleVersion: AuthKeyScheduleVersion;
}

export type ApiCreateAccountRequest = {
  username: string;
  authKey: Base64;
  keyScheduleVersion: AuthKeyScheduleVersion;
  salt: Base64;
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
  password: string;
  salt: Base64;
  keyScheduleVersion: AuthKeyScheduleVersion;
}

export interface AuthUserKeys {
  authKey: Base64;
  keyEncryptionKey: CryptoKey;
}

export type AuthWorkerResponse =
  | {
      data: AuthUserKeys;
    }
  | {
      error: Error;
    };
