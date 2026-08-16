"use client";

import { type PropsWithChildren, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useUser } from "@/state/user.state";

export function AuthRouteGuard({ children }: PropsWithChildren) {
  const user = useUser((state) => state.user);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace("/journal");
    }
  }, [router, user]);

  return user ? null : children;
}
