import { z } from "zod";
import { AUTH_ERROR_CODES } from "@/api/auth/auth.error";
import type {
  CreateAccountRequest,
  CreateAccountResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  SessionResponse,
} from "@/api/auth/auth.type";
import type { User } from "@/api/auth/user.type";
import { localServerStore, type StoredUser } from "@/local-server/store";

const usernameSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^[a-zA-Z0-9_-]{3,24}$/);
const passwordSchema = z.string().min(1).min(8).max(128);

const loginRequestSchema: z.ZodType<LoginRequest> = z.strictObject({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

const createAccountRequestSchema = z
  .strictObject({
    username: usernameSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine(({ confirmPassword, password }) => confirmPassword === password, {
    path: ["confirmPassword"],
  }) satisfies z.ZodType<CreateAccountRequest>;

function toPublicUser(user: StoredUser): User {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
  };
}

function getValidationErrorCode(input: unknown) {
  if (typeof input !== "object" || input === null) {
    return AUTH_ERROR_CODES.usernameRequired;
  }

  const candidate = input as Record<string, unknown>;
  const username = candidate["username"];
  const password = candidate["password"];
  const confirmPassword = candidate["confirmPassword"];

  if (typeof username !== "string" || username.trim().length === 0) {
    return AUTH_ERROR_CODES.usernameRequired;
  }

  if (!/^[a-zA-Z0-9_-]{3,24}$/.test(username.trim())) {
    return AUTH_ERROR_CODES.usernameInvalid;
  }

  if (typeof password !== "string" || password.length === 0) {
    return AUTH_ERROR_CODES.passwordRequired;
  }

  if (password.length < 8) {
    return AUTH_ERROR_CODES.passwordTooShort;
  }

  if (typeof confirmPassword === "string" && confirmPassword !== password) {
    return AUTH_ERROR_CODES.passwordsMismatch;
  }

  return AUTH_ERROR_CODES.invalidCredentials;
}

export async function handleLoginRequest(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  const result = loginRequestSchema.safeParse(body);

  if (!result.success) {
    const response = {
      success: false,
      error: { code: getValidationErrorCode(body) },
    } satisfies LoginResponse;

    return Response.json(response, { status: 400 });
  }

  const normalizedUsername = result.data.username.toLowerCase();
  const user = localServerStore.users.find(
    ({ username }) => username.toLowerCase() === normalizedUsername,
  );

  if (!user || user.password !== result.data.password) {
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

export async function handleCreateAccountRequest(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  const result = createAccountRequestSchema.safeParse(body);

  if (!result.success) {
    const response = {
      success: false,
      error: { code: getValidationErrorCode(body) },
    } satisfies CreateAccountResponse;

    return Response.json(response, { status: 400 });
  }

  const normalizedUsername = result.data.username.toLowerCase();
  const usernameTaken = localServerStore.users.some(
    ({ username }) => username.toLowerCase() === normalizedUsername,
  );

  if (usernameTaken) {
    const response = {
      success: false,
      error: { code: AUTH_ERROR_CODES.usernameTaken },
    } satisfies CreateAccountResponse;

    return Response.json(response, { status: 409 });
  }

  const user: StoredUser = {
    id: crypto.randomUUID(),
    username: normalizedUsername,
    displayName: result.data.username,
    password: result.data.password,
    salt: crypto.randomUUID(),
  };

  localServerStore.users.push(user);
  localServerStore.entriesByUserId[user.id] = [];
  localServerStore.activeUserId = user.id;

  const response = {
    success: true,
    data: { user: toPublicUser(user) },
  } satisfies CreateAccountResponse;

  return Response.json(response, { status: 201 });
}

export function handleSessionRequest(): Response {
  const user = localServerStore.users.find(({ id }) => id === localServerStore.activeUserId);

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
