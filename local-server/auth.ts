import { AUTH_ERROR_CODES } from "@/api/auth/auth.error";
import type {
  CreateAccountRequest,
  CreateAccountResponse,
  LoginResponse,
  LogoutResponse,
  SaltRequest,
  SaltResponse,
  SessionResponse,
  VerifyCredentialsRequest,
} from "@/api/auth/auth.type";
import type { User } from "@/api/auth/user.type";
import { localServerStore, type StoredUser } from "@/local-server/store";
import sodium from "libsodium-wrappers-sumo";
import { z } from "zod";

const usernameSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^[a-zA-Z0-9_-]{3,24}$/);
const authKeySchema = z.string().regex(/^[0-9a-f]{64}$/i);

const saltRequestSchema: z.ZodType<SaltRequest> = z.strictObject({
  username: usernameSchema,
});

const verifyCredentialsRequestSchema: z.ZodType<VerifyCredentialsRequest> =
  z.strictObject({
    username: usernameSchema,
    authKey: authKeySchema,
  });

const createAccountRequestSchema: z.ZodType<CreateAccountRequest> =
  verifyCredentialsRequestSchema;

function toPublicUser(user: StoredUser): User {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
  };
}

function getUsernameErrorCode(input: unknown) {
  if (typeof input !== "object" || input === null) {
    return AUTH_ERROR_CODES.usernameRequired;
  }

  const username = (input as Record<string, unknown>)["username"];

  if (typeof username !== "string" || username.trim().length === 0) {
    return AUTH_ERROR_CODES.usernameRequired;
  }

  return AUTH_ERROR_CODES.usernameInvalid;
}

function findUser(username: string) {
  const normalizedUsername = username.toLowerCase();

  return localServerStore.users.find(
    (user) => user.username.toLowerCase() === normalizedUsername,
  );
}

async function generateSalt() {
  await sodium.ready;

  return sodium.to_base64(
    sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES),
    sodium.base64_variants.ORIGINAL,
  );
}

async function hashAuthKey(authKey: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(authKey),
  );

  return new Uint8Array(digest);
}

async function authKeyMatches(authKey: string, storedHash: string) {
  const candidateHash = await hashAuthKey(authKey);
  await sodium.ready;
  const expectedHash = sodium.from_base64(
    storedHash,
    sodium.base64_variants.ORIGINAL,
  );

  return (
    candidateHash.length === expectedHash.length &&
    sodium.memcmp(candidateHash, expectedHash)
  );
}

export async function handleLoginSaltRequest(
  request: Request,
): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  const result = saltRequestSchema.safeParse(body);

  if (!result.success) {
    const response = {
      success: false,
      error: { code: getUsernameErrorCode(body) },
    } satisfies SaltResponse;

    return Response.json(response, { status: 400 });
  }

  const user = findUser(result.data.username);

  if (!user) {
    const response = {
      success: false,
      error: { code: AUTH_ERROR_CODES.invalidCredentials },
    } satisfies SaltResponse;

    return Response.json(response, { status: 401 });
  }

  const response = {
    success: true,
    data: { salt: user.salt },
  } satisfies SaltResponse;

  return Response.json(response);
}

export async function handleLoginRequest(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  const result = verifyCredentialsRequestSchema.safeParse(body);

  if (!result.success) {
    const response = {
      success: false,
      error: { code: AUTH_ERROR_CODES.invalidCredentials },
    } satisfies LoginResponse;

    return Response.json(response, { status: 400 });
  }

  const user = findUser(result.data.username);
  const credentialsMatch = user
    ? await authKeyMatches(result.data.authKey, user.authKeyHash)
    : false;

  if (!user || !credentialsMatch) {
    const response = {
      success: false,
      error: { code: AUTH_ERROR_CODES.invalidCredentials },
    } satisfies LoginResponse;

    return Response.json(response, { status: 401 });
  }

  localServerStore.activeUserId = user.id;

  const response = {
    success: true,
    data: { user: toPublicUser(user) },
  } satisfies LoginResponse;

  return Response.json(response);
}

export async function handleCreateAccountSaltRequest(
  request: Request,
): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  const result = saltRequestSchema.safeParse(body);

  if (!result.success) {
    const response = {
      success: false,
      error: { code: getUsernameErrorCode(body) },
    } satisfies SaltResponse;

    return Response.json(response, { status: 400 });
  }

  const normalizedUsername = result.data.username.toLowerCase();

  if (findUser(normalizedUsername)) {
    const response = {
      success: false,
      error: { code: AUTH_ERROR_CODES.usernameTaken },
    } satisfies SaltResponse;

    return Response.json(response, { status: 409 });
  }

  const salt = await generateSalt();
  localServerStore.pendingAccountSalts[normalizedUsername] = salt;

  const response = {
    success: true,
    data: { salt },
  } satisfies SaltResponse;

  return Response.json(response, { status: 201 });
}

export async function handleCreateAccountRequest(
  request: Request,
): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  const result = createAccountRequestSchema.safeParse(body);

  if (!result.success) {
    const response = {
      success: false,
      error: { code: AUTH_ERROR_CODES.invalidCredentials },
    } satisfies CreateAccountResponse;

    return Response.json(response, { status: 400 });
  }

  const normalizedUsername = result.data.username.toLowerCase();

  if (findUser(normalizedUsername)) {
    const response = {
      success: false,
      error: { code: AUTH_ERROR_CODES.usernameTaken },
    } satisfies CreateAccountResponse;

    return Response.json(response, { status: 409 });
  }

  const salt = localServerStore.pendingAccountSalts[normalizedUsername];

  if (!salt) {
    const response = {
      success: false,
      error: { code: AUTH_ERROR_CODES.invalidCredentials },
    } satisfies CreateAccountResponse;

    return Response.json(response, { status: 400 });
  }

  const authKeyHash = await hashAuthKey(result.data.authKey);
  await sodium.ready;

  const user: StoredUser = {
    id: crypto.randomUUID(),
    username: normalizedUsername,
    displayName: result.data.username,
    authKeyHash: sodium.to_base64(authKeyHash, sodium.base64_variants.ORIGINAL),
    salt,
  };

  localServerStore.users.push(user);
  localServerStore.entriesByUserId[user.id] = [];
  localServerStore.activeUserId = user.id;
  delete localServerStore.pendingAccountSalts[normalizedUsername];

  const response = {
    success: true,
    data: { user: toPublicUser(user) },
  } satisfies CreateAccountResponse;

  return Response.json(response, { status: 201 });
}

export function handleSessionRequest(): Response {
  const user = localServerStore.users.find(
    ({ id }) => id === localServerStore.activeUserId,
  );

  if (!user) {
    const response = {
      success: false,
      error: { code: AUTH_ERROR_CODES.unauthorized },
    } satisfies SessionResponse;

    return Response.json(response, { status: 401 });
  }

  const response = {
    success: true,
    data: { user: toPublicUser(user) },
  } satisfies SessionResponse;

  return Response.json(response);
}

export function handleLogoutRequest(): Response {
  localServerStore.activeUserId = null;

  const response = {
    success: true,
    data: null,
  } satisfies LogoutResponse;

  return Response.json(response);
}
