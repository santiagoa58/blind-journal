import type {
  ApiAuthSession,
  ApiCreateAccountRequest,
  ApiSaltRequest,
  ApiSaltResponse,
  ApiVerifyCredentialsRequest,
  ClientCreateAccountRequest,
  ClientLoginRequest,
} from "@/api/auth/auth.type";
import { AUTH_CLIENT_ERROR_CODES, AuthClientError } from "@/api/auth/auth-client.error";
import { getAuthWorkerClient, terminateAuthWorkerClient } from "@/api/auth/auth-worker-client";
import { api } from "@/api/http";

const MINIMUM_PASSWORD_CHARACTERS = 8;

export function getLoginSalt(input: ApiSaltRequest) {
  return api
    .post("auth/login/salt", {
      cache: "no-store",
      json: input,
    })
    .json<ApiSaltResponse>();
}

export function getCreateAccountSalt(input: ApiSaltRequest) {
  return api
    .post("auth/accounts/salt", {
      cache: "no-store",
      json: input,
    })
    .json<ApiSaltResponse>();
}

function verifyCredentials(input: ApiVerifyCredentialsRequest) {
  return api
    .post("auth/login", {
      cache: "no-store",
      json: input,
    })
    .json<ApiAuthSession>();
}

function submitAccount(input: ApiCreateAccountRequest) {
  return api
    .post("auth/accounts", {
      cache: "no-store",
      json: input,
    })
    .json<ApiAuthSession>();
}

export function getSession() {
  return api.get("auth/session", { cache: "no-store" }).json<ApiAuthSession>();
}

export function logout() {
  return api.post("auth/logout", { cache: "no-store" }).json<null>();
}

export async function login(input: ClientLoginRequest) {
  if (input.password.length === 0) {
    throw new AuthClientError(AUTH_CLIENT_ERROR_CODES.passwordRequired);
  }

  try {
    const userKeys = await getAuthWorkerClient().getUserKeys(input.password, input.salt);
    const request = {
      username: input.username,
      authKey: userKeys.authKey,
    } satisfies ApiVerifyCredentialsRequest;
    const response = await verifyCredentials(request);

    return { ...response, keyEncryptionKey: userKeys.keyEncryptionKey };
  } finally {
    terminateAuthWorkerClient();
  }
}

export async function createAccount(input: ClientCreateAccountRequest) {
  if (input.password.length === 0) {
    throw new AuthClientError(AUTH_CLIENT_ERROR_CODES.passwordRequired);
  }

  if (input.password.length < MINIMUM_PASSWORD_CHARACTERS) {
    throw new AuthClientError(AUTH_CLIENT_ERROR_CODES.passwordTooShort);
  }

  if (input.password !== input.confirmPassword) {
    throw new AuthClientError(AUTH_CLIENT_ERROR_CODES.passwordsMismatch);
  }

  const { salt } = await getCreateAccountSalt({ username: input.username });

  try {
    const userKeys = await getAuthWorkerClient().getUserKeys(input.password, salt);
    const request = {
      username: input.username,
      authKey: userKeys.authKey,
    } satisfies ApiCreateAccountRequest;
    const response = await submitAccount(request);

    return { ...response, keyEncryptionKey: userKeys.keyEncryptionKey };
  } finally {
    terminateAuthWorkerClient();
  }
}
