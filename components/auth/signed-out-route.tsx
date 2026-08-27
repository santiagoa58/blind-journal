"use client";

import { type PropsWithChildren, useEffect } from "react";
import { useAppSession } from "@/client-state/app-session.state";
import { useRouter } from "@/i18n/navigation";

/** Owns the signed-out-only access rule for authentication pages. */
export function SignedOutRoute({ children }: PropsWithChildren) {
  const status = useAppSession((state) => state.session.status);
  const router = useRouter();

  useEffect(() => {
    if (status === "unlocked") {
      router.replace("/journal");
    }
  }, [router, status]);

  return status === "signed-out" ? children : null;
}
