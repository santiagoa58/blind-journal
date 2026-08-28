import "server-only";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { ApiUser } from "@/lib/api/auth/user.type";
import { getCurrentUser } from "@/server/auth/current-user";

export async function requireAuthenticatedRoute(locale: Locale): Promise<ApiUser> {
  const user = await getCurrentUser();

  if (!user) {
    return redirect({ href: "/", locale });
  }

  return user;
}
