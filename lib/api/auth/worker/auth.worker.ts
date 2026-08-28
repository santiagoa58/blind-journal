/// <reference lib="webworker" />

import type { AuthWorkerPayload, AuthWorkerResponse } from "@/lib/api/auth/auth.type";
import { deriveAuthUserKeys } from "@/lib/api/auth/worker/auth-key-derivation";

self.addEventListener("message", async (event: MessageEvent<AuthWorkerPayload>) => {
  try {
    const response = {
      data: await deriveAuthUserKeys(
        event.data.password,
        event.data.salt,
        event.data.keyScheduleVersion,
      ),
    } satisfies AuthWorkerResponse;
    self.postMessage(response);
  } catch (error) {
    const response = {
      error: error instanceof Error ? error : new Error(String(error)),
    } satisfies AuthWorkerResponse;
    self.postMessage(response);
  }
});
