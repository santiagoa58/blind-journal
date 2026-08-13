import type { AuthKeyScheduleVersion } from "@/api/auth/auth-key-schedule";
import { AUTH_WORKER_ERROR_CODES, AuthWorkerError } from "@/api/auth/worker/auth-worker.error";
import type { Base64 } from "@/types/base64";
import type { AuthUserKeys, AuthWorkerPayload, AuthWorkerResponse } from "./auth.type";

type PendingRequest = {
  resolve: (keys: AuthUserKeys) => void;
  reject: (reason: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
};

const AUTH_WORKER_REQUEST_TIMEOUT_MS = 60_000;

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

  private takePendingRequest(requestId: string): PendingRequest | undefined {
    const request = this._pending.get(requestId);
    if (request) {
      clearTimeout(request.timeout);
      this._pending.delete(requestId);
    }
    return request;
  }

  private rejectAll = (err: Error) => {
    this._pending.forEach((req) => {
      clearTimeout(req.timeout);
      req.reject(err);
    });
    this._pending.clear();
  };

  private closeWithError(error: AuthWorkerError): void {
    if (this.closed) {
      return;
    }

    this.closed = true;
    this._worker.removeEventListener("message", this.handleWorkerResponse);
    this._worker.removeEventListener("error", this.handleWorkerError);
    this._worker.removeEventListener("messageerror", this.handleMessageError);
    this._worker.terminate();
    this.rejectAll(error);
  }

  private handleWorkerError = (event: ErrorEvent) => {
    this.closeWithError(
      new AuthWorkerError(AUTH_WORKER_ERROR_CODES.unavailable, {
        cause: event.error ?? event,
      }),
    );
  };

  private handleMessageError = (event: MessageEvent) => {
    this.closeWithError(new AuthWorkerError(AUTH_WORKER_ERROR_CODES.unavailable, { cause: event }));
  };

  private handleWorkerResponse = (e: MessageEvent<AuthWorkerResponse>) => {
    const request = this.takePendingRequest(e.data.requestId);
    if (!request) {
      return;
    }
    if ("error" in e.data) {
      request.reject(
        new AuthWorkerError(AUTH_WORKER_ERROR_CODES.unavailable, { cause: e.data.error }),
      );
    } else {
      request.resolve(e.data.data);
    }
  };

  getUserKeys = (password: string, salt: Base64, keyScheduleVersion: AuthKeyScheduleVersion) => {
    if (this.closed) {
      return Promise.reject(new AuthWorkerError(AUTH_WORKER_ERROR_CODES.unavailable));
    }
    return new Promise<AuthUserKeys>((resolve, reject) => {
      const payload = {
        password,
        salt,
        keyScheduleVersion,
        requestId: crypto.randomUUID(),
      } satisfies AuthWorkerPayload;

      const timeout = setTimeout(() => {
        this.closeWithError(new AuthWorkerError(AUTH_WORKER_ERROR_CODES.unavailable));
      }, AUTH_WORKER_REQUEST_TIMEOUT_MS);
      this._pending.set(payload.requestId, { resolve, reject, timeout });

      try {
        this._worker.postMessage(payload);
      } catch (error) {
        this.closeWithError(
          new AuthWorkerError(AUTH_WORKER_ERROR_CODES.unavailable, { cause: error }),
        );
      }
    });
  };

  terminate = () => {
    this.closeWithError(new AuthWorkerError(AUTH_WORKER_ERROR_CODES.unavailable));
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
