import type {
  CreateAccountRequest,
  CreateAccountResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  SessionResponse,
} from "@/api/auth/auth.type";
import { api } from "@/api/client";

export function login(input: LoginRequest): Promise<LoginResponse> {
  return api
    .post("auth/login", {
      cache: "no-store",
      json: input,
    })
    .json<LoginResponse>();
}

export function createAccount(input: CreateAccountRequest): Promise<CreateAccountResponse> {
  return api
    .post("auth/accounts", {
      cache: "no-store",
      json: input,
    })
    .json<CreateAccountResponse>();
}

export function getSession(): Promise<SessionResponse> {
  return api.get("auth/session", { cache: "no-store" }).json<SessionResponse>();
}

export function logout(): Promise<LogoutResponse> {
  return api.post("auth/logout", { cache: "no-store" }).json<LogoutResponse>();
}
