import { constants as HTTP_STATUS } from "node:http2";
import { localApplicationStore, localServerStore } from "@/local-server/store";
import { getAuthErrorHttpStatus } from "@/server/auth.error";
import { createAuthService } from "@/server/auth.service";

// TODO(test-server): Reuse the production HTTP handler behavior as well as the auth service. This
// adapter should supply only local storage/session dependencies so status and response logic cannot
// drift from the real server.

const authService = createAuthService(localApplicationStore);

async function readBody(request: Request): Promise<unknown> {
  return request.json().catch(() => null);
}

export async function handleLoginSaltRequest(request: Request): Promise<Response> {
  const result = authService.getLoginSalt(await readBody(request));
  return Response.json(result.success ? result.data : result.error, {
    status: result.success ? HTTP_STATUS.HTTP_STATUS_OK : getAuthErrorHttpStatus(result.error.code),
  });
}

export async function handleLoginRequest(request: Request): Promise<Response> {
  const result = await authService.verifyCredentials(await readBody(request));
  if (result.success) localServerStore.activeUserId = result.data.user.id;
  return Response.json(result.success ? result.data : result.error, {
    status: result.success ? HTTP_STATUS.HTTP_STATUS_OK : getAuthErrorHttpStatus(result.error.code),
  });
}

export async function handleCreateAccountSaltRequest(request: Request): Promise<Response> {
  const result = await authService.createAccountSalt(await readBody(request));
  const status = result.success
    ? HTTP_STATUS.HTTP_STATUS_CREATED
    : getAuthErrorHttpStatus(result.error.code);
  return Response.json(result.success ? result.data : result.error, { status });
}

export async function handleCreateAccountRequest(request: Request): Promise<Response> {
  const result = await authService.createAccount(await readBody(request));
  if (result.success) localServerStore.activeUserId = result.data.user.id;
  const status = result.success
    ? HTTP_STATUS.HTTP_STATUS_CREATED
    : getAuthErrorHttpStatus(result.error.code);
  return Response.json(result.success ? result.data : result.error, { status });
}

export function handleSessionRequest(): Response {
  const result = authService.getSession(localServerStore.activeUserId);
  return Response.json(result.success ? result.data : result.error, {
    status: result.success ? HTTP_STATUS.HTTP_STATUS_OK : getAuthErrorHttpStatus(result.error.code),
  });
}

export function handleLogoutRequest(): Response {
  localServerStore.activeUserId = null;
  return Response.json(null);
}
