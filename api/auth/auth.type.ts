import type { User } from "@/api/auth/user.type";
import type { ApiResponse } from "@/api/response.type";

export type LoginRequest = {
  username: string;
  password: string;
};

export type CreateAccountRequest = {
  username: string;
  password: string;
  confirmPassword: string;
};

export type AuthSession = {
  user: User;
};

export type LoginResponse = ApiResponse<AuthSession>;
export type CreateAccountResponse = ApiResponse<AuthSession>;
export type SessionResponse = ApiResponse<AuthSession>;
export type LogoutResponse = ApiResponse<null>;
