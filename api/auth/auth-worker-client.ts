import { AUTH_WORKER_ERROR_CODES, AuthWorkerError } from "@/api/auth/auth-worker.error";
import type { AuthUserKeys, AuthWorkerPayload, AuthWorkerResponse } from "./auth.type";
import type { Base64 } from "@/types/base64";

type PendingRequest = {
  resolve: (keys: AuthUserKeys) => void;
  reject: (reason: Error) => void;
};

class AuthWorkerClient {
  private readonly _worker: Worker;
  private readonly _pending = new Map<string, PendingRequest>();
  private closed = false;

  constructor() {
    this._worker = new Worker(new URL("./auth.worker.ts", import.meta.url), { type: "module" });
    this._worker.addEventListener("message", this.handleWorkerResponse);
    this._worker.addEventListener("error", this.handleWorkerError);
    this._worker.addEventListener("messageerror", this.handleMessageError);
  }

  private rejectAll = (err: Error) => {
    this._pending.forEach((req) => {
      req.reject(err);
    });
    this._pending.clear();
  };

  private handleWorkerError = (event: ErrorEvent) => {
    this.rejectAll(
      new AuthWorkerError(AUTH_WORKER_ERROR_CODES.unavailable, {
        cause: event.error ?? event,
      }),
    );
  };

  private handleMessageError = (event: MessageEvent) => {
    this.rejectAll(new AuthWorkerError(AUTH_WORKER_ERROR_CODES.unavailable, { cause: event }));
  };

  private handleWorkerResponse = (e: MessageEvent<AuthWorkerResponse>) => {
    const request = this._pending.get(e.data.requestId);
    if (!request) {
      return;
    }
    this._pending.delete(e.data.requestId);
    if ("error" in e.data) {
      request.reject(
        new AuthWorkerError(AUTH_WORKER_ERROR_CODES.unavailable, e.data.error),
      );
    } else {
      request.resolve(e.data.data);
    }
  };

  getUserKeys = async (password: string, salt: Base64) => {
    if (this.closed) {
      return Promise.reject(new AuthWorkerError(AUTH_WORKER_ERROR_CODES.unavailable));
    }
    return new Promise<AuthUserKeys>((resolve, reject) => {
      const payload = {
        password,
        salt,
        requestId: crypto.randomUUID(),
      } satisfies AuthWorkerPayload;

      this._worker.postMessage(payload);
      this._pending.set(payload.requestId, { resolve, reject });
    });
  };

  terminate = () => {
    if (this.closed) {
      return;
    }
    this._worker.terminate();
    this.rejectAll(new AuthWorkerError(AUTH_WORKER_ERROR_CODES.unavailable));
    this.closed = true;
  };
}

let authWorkerClientSingleton: AuthWorkerClient | null = null;

export function getAuthWorkerClient(): AuthWorkerClient {
  if (authWorkerClientSingleton == null) {
    authWorkerClientSingleton = new AuthWorkerClient();
  }
  return authWorkerClientSingleton;
}

export function terminateAuthWorkerClient(): void {
  if (authWorkerClientSingleton != null) {
    authWorkerClientSingleton.terminate();
    authWorkerClientSingleton = null;
  }
}
