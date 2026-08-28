// @vitest-environment jsdom

import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAppToast } from "@/hooks/use-app-toast";

const mocks = vi.hoisted(() => ({
  reportClientError: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("sonner", () => ({
  toast: { error: mocks.toastError, success: vi.fn() },
}));

vi.mock("@/client.error", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/client.error")>()),
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

beforeEach(() => {
  appToast = renderHook(() => useAppToast()).result.current;
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
});
