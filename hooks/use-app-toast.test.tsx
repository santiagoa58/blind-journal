// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAppToast } from "@/hooks/use-app-toast";

const mocks = vi.hoisted(() => ({
  reportClientError: vi.fn(),
  toastDismiss: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("sonner", () => ({
  toast: { dismiss: mocks.toastDismiss, error: mocks.toastError, success: vi.fn() },
}));

vi.mock("@/client.error", () => ({
  isCodedError: (error: unknown) =>
    error instanceof Error && "code" in error && typeof error.code === "string",
  reportClientError: mocks.reportClientError,
}));

vi.mock("@/i18n/error-message", () => ({
  useErrorMessage: () => (error: unknown) => {
    const code = (error as { code?: string }).code;
    if (code === "KNOWN_ERROR") {
      return "mapped message";
    }
    return code === "API_UNEXPECTED" ? "unexpected message" : undefined;
  },
}));

let appToast: ReturnType<typeof useAppToast>;
let container: HTMLDivElement;
let root: Root;

function Harness() {
  appToast = useAppToast();
  return null;
}

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(<Harness />));
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

describe("useAppToast", () => {
  it("reports an unmapped error before showing the localized fallback", () => {
    const error = Object.assign(new Error("unmapped"), { code: "UNKNOWN_ERROR" });

    appToast.error(error);

    expect(mocks.reportClientError).toHaveBeenCalledExactlyOnceWith(error);
    expect(mocks.toastError).toHaveBeenCalledExactlyOnceWith("unexpected");
  });

  it("does not report an error with a known message mapping", () => {
    appToast.error(Object.assign(new Error("known"), { code: "KNOWN_ERROR" }));

    expect(mocks.reportClientError).not.toHaveBeenCalled();
    expect(mocks.toastError).toHaveBeenCalledExactlyOnceWith("mapped message");
  });

  it("reports an unexpected API error even though it has a fallback message", () => {
    const error = Object.assign(new Error("unexpected"), {
      code: "API_UNEXPECTED",
      requestId: "server-request-id",
    });

    appToast.error(error);

    expect(mocks.reportClientError).toHaveBeenCalledExactlyOnceWith(error);
    expect(mocks.toastError).toHaveBeenCalledExactlyOnceWith("unexpected message");
  });

  it("passes retry options through and can dismiss the resulting toast", () => {
    const options = { id: "retryable-error" };

    appToast.error(Object.assign(new Error("known"), { code: "KNOWN_ERROR" }), options);
    appToast.dismiss(options.id);

    expect(mocks.toastError).toHaveBeenCalledExactlyOnceWith("mapped message", options);
    expect(mocks.toastDismiss).toHaveBeenCalledExactlyOnceWith(options.id);
  });
});
