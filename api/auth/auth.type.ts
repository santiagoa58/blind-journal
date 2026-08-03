import type { User } from "@/api/auth/user.type";
import type { ApiResponse } from "@/api/response.type";

export type LoginRequest = {
  username: string;
  password: string;
  salt: string;
};

export type CreateAccountInput = {
  username: string;
  password: string;
  confirmPassword: string;
};

export type SaltRequest = {
  username: string;
};

export type SaltResponse = ApiResponse<{
  salt: string;
}>;

export type VerifyCredentialsRequest = {
  username: string;
  authKey: string;
};

export type CreateAccountRequest = VerifyCredentialsRequest;

export type AuthSession = {
  user: User;
};

export type LoginResponse = ApiResponse<AuthSession>;
export type CreateAccountResponse = ApiResponse<AuthSession>;
export type SessionResponse = ApiResponse<AuthSession>;
export type LogoutResponse = ApiResponse<null>;
