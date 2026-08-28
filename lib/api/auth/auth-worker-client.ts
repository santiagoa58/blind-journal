import type { AuthUserKeys, AuthWorkerPayload, AuthWorkerResponse } from "@/lib/api/auth/auth.type";
import type { AuthKeyScheduleVersion } from "@/lib/api/auth/auth-key-schedule";
import { AUTH_WORKER_ERROR_CODES, AuthWorkerError } from "@/lib/api/auth/worker/auth-worker.error";
import type { Base64 } from "@/types/base64";

const AUTH_WORKER_REQUEST_TIMEOUT_MS = 60_000;

export function deriveAuthUserKeysInWorker(
  password: string,
  salt: Base64,
  keyScheduleVersion: AuthKeyScheduleVersion,
): Promise<AuthUserKeys> {
  return new Promise((resolve, reject) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL("./worker/auth.worker.ts", import.meta.url), { type: "module" });
    } catch (error) {
      reject(new AuthWorkerError(AUTH_WORKER_ERROR_CODES.unavailable, { cause: error }));
      return;
    }

    let settled = false;
    const timeout = setTimeout(
      () => rejectUnavailable(new Error("Authentication worker timed out.")),
      AUTH_WORKER_REQUEST_TIMEOUT_MS,
    );

    function settle(callback: VoidFunction) {
      if (settled) {
        return;
      }

      // cleanup
      settled = true;
      clearTimeout(timeout);
      worker.removeEventListener("message", handleMessage);
      worker.removeEventListener("error", handleWorkerError);
      worker.removeEventListener("messageerror", handleMessageError);
      worker.terminate();

      callback();
    }

    function rejectUnavailable(cause: unknown) {
      settle(() => reject(new AuthWorkerError(AUTH_WORKER_ERROR_CODES.unavailable, { cause })));
    }

    function handleMessage(event: MessageEvent<AuthWorkerResponse>) {
      const response = event.data;
      if ("error" in response) {
        rejectUnavailable(response.error);
        return;
      }

      settle(() => resolve(response.data));
    }

    function handleWorkerError(event: ErrorEvent) {
      rejectUnavailable(event.error ?? event);
    }

    function handleMessageError(event: MessageEvent) {
      rejectUnavailable(event);
    }

    worker.addEventListener("message", handleMessage);
    worker.addEventListener("error", handleWorkerError);
    worker.addEventListener("messageerror", handleMessageError);

    const payload = { password, salt, keyScheduleVersion } satisfies AuthWorkerPayload;
    try {
      worker.postMessage(payload);
    } catch (error) {
      rejectUnavailable(error);
    }
  });
}
