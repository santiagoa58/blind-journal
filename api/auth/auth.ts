import { AUTH_ERROR_CODES } from "@/api/auth/auth.error";
import type {
  CreateAccountInput,
  CreateAccountRequest,
  CreateAccountResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  SaltRequest,
  SaltResponse,
  SessionResponse,
  VerifyCredentialsRequest,
} from "@/api/auth/auth.type";
import { api } from "@/api/client";
import { deriveMasterKey, deriveUserKeys } from "./auth.crypto";

export function getLoginSalt(input: SaltRequest): Promise<SaltResponse> {
  return api
    .post("auth/login/salt", {
      cache: "no-store",
      json: input,
    })
    .json<SaltResponse>();
}

export async function login(input: LoginRequest): Promise<LoginResponse> {
  const salt = Uint8Array.from(atob(input.salt), (character) =>
    character.charCodeAt(0),
  );
  const masterKey = await deriveMasterKey(input.password, salt);
  const { authKey } = await deriveUserKeys(masterKey);
  const request = {
    username: input.username,
    authKey,
  } satisfies VerifyCredentialsRequest;

  return api
    .post("auth/login", {
      cache: "no-store",
      json: request,
    })
    .json<LoginResponse>();
}

function requestAccountSalt(input: SaltRequest): Promise<SaltResponse> {
  return api
    .post("auth/accounts/salt", {
      cache: "no-store",
      json: input,
    })
    .json<SaltResponse>();
}

export async function createAccount(
  input: CreateAccountInput,
): Promise<CreateAccountResponse> {
  if (input.password.length === 0) {
    return {
      success: false,
      error: { code: AUTH_ERROR_CODES.passwordRequired },
    };
  }

  if (input.password.length < 8) {
    return {
      success: false,
      error: { code: AUTH_ERROR_CODES.passwordTooShort },
    };
  }

  if (input.password !== input.confirmPassword) {
    return {
      success: false,
      error: { code: AUTH_ERROR_CODES.passwordsMismatch },
    };
  }

  const saltResponse = await requestAccountSalt({ username: input.username });

  if (!saltResponse.success) {
    return saltResponse;
  }

  const salt = Uint8Array.from(atob(saltResponse.data.salt), (character) =>
    character.charCodeAt(0),
  );
  const masterKey = await deriveMasterKey(input.password, salt);
  const { authKey } = await deriveUserKeys(masterKey);
  const request = {
    username: input.username,
    authKey,
  } satisfies CreateAccountRequest;

  return api
    .post("auth/accounts", {
      cache: "no-store",
      json: request,
    })
    .json<CreateAccountResponse>();
}

export function getSession(): Promise<SessionResponse> {
  return api.get("auth/session", { cache: "no-store" }).json<SessionResponse>();
}

export function logout(): Promise<LogoutResponse> {
  return api.post("auth/logout", { cache: "no-store" }).json<LogoutResponse>();
}
