"use client";

import type { PropsWithChildren } from "react";
import { useAppSession } from "@/client-state/app-session.state";

/** Owns the signed-out-only access rule for authentication pages. */
export function SignedOutRoute({ children }: PropsWithChildren) {
  const status = useAppSession((state) => state.session.status);

  return status === "signed-out" ? children : null;
}
