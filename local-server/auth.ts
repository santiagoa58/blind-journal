import { z } from "zod";
import { AUTH_ERROR_CODES } from "@/api/auth/auth.error";
import type { UserSaltRequest, UserSaltResponse } from "@/api/auth/auth.type";
import { users } from "@/mocks/users.mock";

const userSaltRequestSchema: z.ZodType<UserSaltRequest> = z.strictObject({
  username: z.string().trim().min(1),
});

export async function handleUserSaltRequest(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  const requestResult = userSaltRequestSchema.safeParse(body);

  if (!requestResult.success) {
    const response = {
      success: false,
      error: {
        code: AUTH_ERROR_CODES.usernameRequired,
      },
    } satisfies UserSaltResponse;

    return Response.json(response, { status: 400 });
  }

  const user = users.find(({ username }) => username === requestResult.data.username);

  if (!user) {
    const response = {
      success: false,
      error: {
        code: AUTH_ERROR_CODES.userNotFound,
      },
    } satisfies UserSaltResponse;

    return Response.json(response, { status: 404 });
  }

  const response = {
    success: true,
    data: user,
  } satisfies UserSaltResponse;

  return Response.json(response);
}
