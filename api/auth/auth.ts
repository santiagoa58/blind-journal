import type {
  ApiCreateAccountRequest,
  ApiCreateAccountResponse,
  ApiLogoutResponse,
  ApiSaltRequest,
  ApiSaltResponse,
  ApiSessionResponse,
  ApiVerifyCredentialsRequest,
  ApiVerifyCredentialsResponse,
  ClientCreateAccountRequest,
  ClientLoginRequest,
} from "@/api/auth/auth.type";
import { api } from "@/api/client";
import { getAuthWorkerClient } from "./authWorkerClient";

export function getLoginSalt(input: ApiSaltRequest): Promise<ApiSaltResponse> {
  return api
    .post("auth/login/salt", {
      cache: "no-store",
      json: input,
    })
    .json<ApiSaltResponse>();
}

export function getCreateAccountSalt(input: ApiSaltRequest): Promise<ApiSaltResponse> {
  return api
    .post("auth/accounts/salt", {
      cache: "no-store",
      json: input,
    })
    .json<ApiSaltResponse>();
}

export async function login(input: ClientLoginRequest): Promise<ApiVerifyCredentialsResponse> {
  const worker = getAuthWorkerClient();
  const res = await worker.getUserKeys(input.password, input.saltBase64);
  const request = {
    username: input.username,
    authKeyBase64: res.authKeyBase64,
  } satisfies ApiVerifyCredentialsRequest;

  return api
    .post("auth/login", {
      cache: "no-store",
      json: request,
    })
    .json<ApiVerifyCredentialsResponse>();
}

export async function createAccount(
  input: ClientCreateAccountRequest,
): Promise<ApiCreateAccountResponse> {
  const worker = getAuthWorkerClient();
  const res = await worker.getUserKeys(input.password, input.saltBase64);

  const request = {
    username: input.username,
    authKeyBase64: res.authKeyBase64,
  } satisfies ApiCreateAccountRequest;

  return api
    .post("auth/accounts", {
      cache: "no-store",
      json: request,
    })
    .json<ApiCreateAccountResponse>();
}

export function getSession(): Promise<ApiSessionResponse> {
  return api.get("auth/session", { cache: "no-store" }).json<ApiSessionResponse>();
}

export function logout(): Promise<ApiLogoutResponse> {
  return api.post("auth/logout", { cache: "no-store" }).json<ApiLogoutResponse>();
}
