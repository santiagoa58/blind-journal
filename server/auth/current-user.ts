import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";
import type { ApiUser } from "@/api/auth/user.type";
import { getSessionCookieName, getSessionUserIdFromSessionId } from "@/server/auth/session";
import { findUserById } from "@/server/database/accounts";

export const getCurrentUser = cache(async (): Promise<ApiUser | null> => {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(getSessionCookieName())?.value;
  const userId = await getSessionUserIdFromSessionId(sessionId);

  if (!userId) {
    return null;
  }

  const user = await findUserById(userId);
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
  };
});
