import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthUserKeys, AuthWorkerPayload } from "@/api/auth/auth.type";
import { CURRENT_AUTH_KEY_SCHEDULE } from "@/api/auth/auth-key-schedule";
import { getAuthWorkerClient, terminateAuthWorkerClient } from "@/api/auth/auth-worker-client";
import { AUTH_WORKER_ERROR_CODES } from "@/api/auth/worker/auth-worker.error";
import { toBase64 } from "@/crypto/base64";

class TestWorker extends EventTarget {
  readonly postedMessages: AuthWorkerPayload[] = [];
  terminated = false;
  postError: unknown;

  postMessage(payload: AuthWorkerPayload): void {
    if (this.postError) {
      throw this.postError;
    }
    this.postedMessages.push(payload);
  }

  terminate(): void {
    this.terminated = true;
  }

  respond(data: AuthUserKeys): void {
    const request = this.postedMessages.at(-1);
    if (!request) {
      throw new Error("No worker request is pending.");
    }
    this.dispatchEvent(
      new MessageEvent("message", {
        data: { requestId: request.requestId, data },
      }),
    );
  }

  fail(error: Error): void {
    const request = this.postedMessages.at(-1);
    if (!request) {
      throw new Error("No worker request is pending.");
    }
    this.dispatchEvent(
      new MessageEvent("message", {
        data: { requestId: request.requestId, error },
      }),
    );
  }
}

const SALT = toBase64(new Uint8Array(16));
const KEY_SCHEDULE_VERSION = CURRENT_AUTH_KEY_SCHEDULE.version;

let worker: TestWorker;

beforeEach(() => {
  worker = new TestWorker();
  vi.stubGlobal(
    "Worker",
    vi.fn(function Worker() {
      return worker;
    }),
  );
});

afterEach(() => {
  terminateAuthWorkerClient();
  vi.useRealTimers();
});

describe("authentication worker lifecycle", () => {
  it("settles a request and clears its timeout when the worker responds", async () => {
    vi.useFakeTimers();
    const keyEncryptionKey = await crypto.subtle.generateKey(
      { name: "AES-KW", length: 256 },
      false,
      ["wrapKey", "unwrapKey"],
    );
    const keys = {
      authKey: toBase64(new Uint8Array(32)),
      keyEncryptionKey,
    } satisfies AuthUserKeys;
    const request = getAuthWorkerClient().getUserKeys("test password", SALT, KEY_SCHEDULE_VERSION);

    worker.respond(keys);

    await expect(request).resolves.toBe(keys);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("terminates a worker and rejects a derivation that never settles", async () => {
    vi.useFakeTimers();
    const request = getAuthWorkerClient().getUserKeys("test password", SALT, KEY_SCHEDULE_VERSION);
    const rejection = expect(request).rejects.toMatchObject({
      name: "AuthWorkerError",
      code: AUTH_WORKER_ERROR_CODES.unavailable,
    });

    await vi.runAllTimersAsync();

    await rejection;
    expect(worker.terminated).toBe(true);
  });

  it("does not leave a request pending when posting to the worker fails", async () => {
    const cause = new DOMException("The worker cannot accept messages.", "InvalidStateError");
    worker.postError = cause;

    await expect(
      getAuthWorkerClient().getUserKeys("test password", SALT, KEY_SCHEDULE_VERSION),
    ).rejects.toMatchObject({
      name: "AuthWorkerError",
      code: AUTH_WORKER_ERROR_CODES.unavailable,
      cause,
    });
    expect(worker.terminated).toBe(true);
  });

  it("rejects a derivation failure returned by the worker", async () => {
    const cause = new RangeError("The account salt has an invalid length.");
    const request = getAuthWorkerClient().getUserKeys("test password", SALT, KEY_SCHEDULE_VERSION);

    worker.fail(cause);

    await expect(request).rejects.toMatchObject({
      name: "AuthWorkerError",
      code: AUTH_WORKER_ERROR_CODES.unavailable,
      cause,
    });
  });

  it("rejects pending work when the client explicitly terminates the worker", async () => {
    const request = getAuthWorkerClient().getUserKeys("test password", SALT, KEY_SCHEDULE_VERSION);
    const rejection = expect(request).rejects.toMatchObject({
      name: "AuthWorkerError",
      code: AUTH_WORKER_ERROR_CODES.unavailable,
    });

    terminateAuthWorkerClient();

    await rejection;
    expect(worker.terminated).toBe(true);
  });

  it("rejects pending work and closes after a fatal worker error", async () => {
    const request = getAuthWorkerClient().getUserKeys("test password", SALT, KEY_SCHEDULE_VERSION);
    const rejection = expect(request).rejects.toMatchObject({
      name: "AuthWorkerError",
      code: AUTH_WORKER_ERROR_CODES.unavailable,
    });

    worker.dispatchEvent(new Event("error"));

    await rejection;
    expect(worker.terminated).toBe(true);
  });
});
