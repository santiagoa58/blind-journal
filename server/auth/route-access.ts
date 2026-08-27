import "server-only";

import type { ApiUser } from "@/api/auth/user.type";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getCurrentUser } from "@/server/auth/current-user";

export async function requireAuthenticatedRoute(locale: Locale): Promise<ApiUser> {
  const user = await getCurrentUser();

  if (!user) {
    return redirect({ href: "/", locale });
  }

  return user;
}
