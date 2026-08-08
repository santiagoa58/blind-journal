import { AUTH_ERROR_CODES } from "@/api/auth/auth.error";
import type { ApiLogoutResponse } from "@/api/auth/auth.type";
import { localApplicationStore, localServerStore } from "@/local-server/store";
import { createAuthService } from "@/server/auth.service";

const authService = createAuthService(localApplicationStore);

async function readBody(request: Request): Promise<unknown> {
  return request.json().catch(() => null);
}

export async function handleLoginSaltRequest(request: Request): Promise<Response> {
  const result = authService.getLoginSalt(await readBody(request));
  return Response.json(result, { status: result.success ? 200 : 401 });
}

export async function handleLoginRequest(request: Request): Promise<Response> {
  const result = await authService.verifyCredentials(await readBody(request));
  if (result.success) localServerStore.activeUserId = result.data.user.id;
  return Response.json(result, { status: result.success ? 200 : 401 });
}

export async function handleCreateAccountSaltRequest(request: Request): Promise<Response> {
  const result = await authService.createAccountSalt(await readBody(request));
  const status = result.success
    ? 201
    : result.error.code === AUTH_ERROR_CODES.usernameTaken
      ? 409
      : 400;
  return Response.json(result, { status });
}

export async function handleCreateAccountRequest(request: Request): Promise<Response> {
  const result = await authService.createAccount(await readBody(request));
  if (result.success) localServerStore.activeUserId = result.data.user.id;
  const status = result.success
    ? 201
    : result.error.code === AUTH_ERROR_CODES.usernameTaken
      ? 409
      : 400;
  return Response.json(result, { status });
}

export function handleSessionRequest(): Response {
  const result = authService.getSession(localServerStore.activeUserId);
  return Response.json(result, { status: result.success ? 200 : 401 });
}

export function handleLogoutRequest(): Response {
  localServerStore.activeUserId = null;
  return Response.json({ success: true, data: null } satisfies ApiLogoutResponse);
}
