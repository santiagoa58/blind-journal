import type { User } from "@/api/auth/user.type";
import type { ApiResponse } from "@/api/response.type";

/************************
 * CLIENT SIDE REQUESTS *
 ************************/

export interface AuthWorkerPayload {
  reqId: string;
  password: string;
  saltBase64: string;
}

export interface AuthUserKeys {
  authKeyBase64: string;
  keyEncryptKey: CryptoKey;
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
  saltBase64: string;
}

export interface ClientCreateAccountRequest {
  username: string;
  password: string;
  saltBase64: string;
}

/****************************
 * API REQUESTS & RESPONSES *
 ****************************/

export interface ApiAuthSession {
  user: User;
}

export interface ApiSaltRequest {
  username: string;
}
export type ApiSaltResponse = ApiResponse<{
  saltBase64: string;
}>;

export interface ApiVerifyCredentialsRequest {
  username: string;
  authKeyBase64: string;
}

export type ApiVerifyCredentialsResponse = ApiResponse<ApiAuthSession>;

export type ApiCreateAccountRequest = {
  username: string;
  authKeyBase64: string;
};

export type ApiCreateAccountResponse = ApiResponse<ApiAuthSession>;

export type ApiSessionResponse = ApiResponse<ApiAuthSession>;
export type ApiLogoutResponse = ApiResponse<null>;
