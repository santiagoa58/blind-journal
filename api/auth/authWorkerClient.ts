import { AUTH_CLIENT_ERROR_CODES } from "@/api/auth/auth.error";
import type { Base64 } from "../general.type";
import type { AuthUserKeys, AuthWorkerPayload, AuthWorkerResponse } from "./auth.type";

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

  private handleWorkerError = (_e: ErrorEvent) => {
    this.rejectAll(new Error(AUTH_CLIENT_ERROR_CODES.unavailable));
  };

  private handleMessageError = (_e: MessageEvent) => {
    this.rejectAll(new Error(AUTH_CLIENT_ERROR_CODES.unavailable));
  };

  private handleWorkerResponse = (e: MessageEvent<AuthWorkerResponse>) => {
    const request = this._pending.get(e.data.reqId);
    if (!request) {
      return;
    }
    this._pending.delete(e.data.reqId);
    if (e.data.success) {
      request.resolve(e.data.data);
    } else {
      request.reject(new Error(e.data.error));
    }
  };

  getUserKeys = async (password: string, salt: Base64) => {
    if (this.closed) {
      return Promise.reject(new Error(AUTH_CLIENT_ERROR_CODES.unavailable));
    }
    return new Promise<AuthUserKeys>((resolve, reject) => {
      const payload = {
        password,
        salt,
        reqId: crypto.randomUUID(),
      } satisfies AuthWorkerPayload;

      this._worker.postMessage(payload);
      this._pending.set(payload.reqId, { resolve, reject });
    });
  };

  terminate = () => {
    if (this.closed) {
      return;
    }
    this._worker.terminate();
    this.rejectAll(new Error(AUTH_CLIENT_ERROR_CODES.unavailable));
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
