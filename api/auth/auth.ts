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
import { getAuthWorkerClient, terminateAuthWorkerClient } from "./authWorkerClient";

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

export async function login(input: ClientLoginRequest) {
  const worker = getAuthWorkerClient();
  const userKeys = await worker.getUserKeys(input.password, input.salt);
  const request = {
    username: input.username,
    authKey: userKeys.authKey,
  } satisfies ApiVerifyCredentialsRequest;

  return api
    .post("auth/login", {
      cache: "no-store",
      json: request,
    })
    .json<ApiVerifyCredentialsResponse>()
    .then((resp) => {
      if (resp.success) {
        // cleanup auth worker after successful login
        terminateAuthWorkerClient();
        return { ...resp, data: { ...resp.data, keyEncryptionKey: userKeys.keyEncryptionKey } };
      }
      return resp;
    });
}

export async function createAccount(input: ClientCreateAccountRequest) {
  const worker = getAuthWorkerClient();
  const userKeys = await worker.getUserKeys(input.password, input.salt);

  const request = {
    username: input.username,
    authKey: userKeys.authKey,
  } satisfies ApiCreateAccountRequest;

  return api
    .post("auth/accounts", {
      cache: "no-store",
      json: request,
    })
    .json<ApiCreateAccountResponse>()
    .then((resp) => {
      if (resp.success) {
        terminateAuthWorkerClient();
        return { ...resp, data: { ...resp.data, keyEncryptionKey: userKeys.keyEncryptionKey } };
      }
      return resp;
    });
}

export function getSession(): Promise<ApiSessionResponse> {
  return api.get("auth/session", { cache: "no-store" }).json<ApiSessionResponse>();
}

export function logout(): Promise<ApiLogoutResponse> {
  return api.post("auth/logout", { cache: "no-store" }).json<ApiLogoutResponse>();
}
