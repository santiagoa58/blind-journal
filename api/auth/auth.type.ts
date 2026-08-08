import type { ApiUser } from "@/api/auth/user.type";
import type { ApiResponse } from "@/api/response.type";
import type { Base64 } from "../general.type";

/************************
 * CLIENT SIDE REQUESTS *
 ************************/

export interface AuthWorkerPayload {
  reqId: string;
  password: string;
  salt: Base64;
}

export interface AuthUserKeys {
  authKey: Base64;
  keyEncryptionKey: CryptoKey;
}
export type AuthWorkerResponse =
  | {
      reqId: string;
      success: true;
      data: AuthUserKeys;
    }
  | {
      reqId: string;
      success: false;
      error: string;
    };

export interface ClientLoginRequest {
  username: string;
  password: string;
  salt: Base64;
}

export interface ClientCreateAccountRequest {
  username: string;
  password: string;
  salt: Base64;
}

/****************************
 * API REQUESTS & RESPONSES *
 ****************************/

export interface ApiAuthSession {
  user: ApiUser;
}

export interface ApiSaltRequest {
  username: string;
}
export type ApiSaltResponse = ApiResponse<{
  salt: Base64;
}>;

export interface ApiVerifyCredentialsRequest {
  username: string;
  authKey: Base64;
}

export type ApiVerifyCredentialsResponse = ApiResponse<ApiAuthSession>;

export type ApiCreateAccountRequest = {
  username: string;
  authKey: Base64;
};

export type ApiCreateAccountResponse = ApiResponse<ApiAuthSession>;

export type ApiSessionResponse = ApiResponse<ApiAuthSession>;
export type ApiLogoutResponse = ApiResponse<null>;
