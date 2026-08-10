import { ClientError } from "@/client.error";

export const AUTH_WORKER_ERROR_CODES = {
  unavailable: "AUTH_WORKER_UNAVAILABLE",
} as const;

export type AuthWorkerErrorCode =
  (typeof AUTH_WORKER_ERROR_CODES)[keyof typeof AUTH_WORKER_ERROR_CODES];

export class AuthWorkerError extends ClientError<AuthWorkerErrorCode> {
  constructor(code: AuthWorkerErrorCode, options?: ErrorOptions) {
    super(code, options);
    this.name = "AuthWorkerError";
  }
}
