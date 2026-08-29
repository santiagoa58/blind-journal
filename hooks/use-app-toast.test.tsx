// @vitest-environment jsdom

import { renderHook } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAppToast } from "@/hooks/use-app-toast";
import { englishMessages } from "@/i18n/messages";
import { API_ERROR_CODES } from "@/lib/api/error";

const mocks = vi.hoisted(() => ({
  reportClientError: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { error: mocks.toastError, success: vi.fn() },
}));

vi.mock("@/lib/client.error", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/client.error")>()),
  reportClientError: mocks.reportClientError,
}));

let appToast: ReturnType<typeof useAppToast>;

function IntlProvider({ children }: PropsWithChildren) {
  return (
    <NextIntlClientProvider locale="en" messages={englishMessages} timeZone="UTC">
      {children}
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  appToast = renderHook(() => useAppToast(), { wrapper: IntlProvider }).result.current;
});

describe("useAppToast", () => {
  it("reports an unmapped error before showing the localized fallback", () => {
    const error = Object.assign(new Error("unmapped"), { code: "UNKNOWN_ERROR" });

    appToast.error(error);

    expect(mocks.reportClientError).toHaveBeenCalledExactlyOnceWith(error);
    expect(mocks.toastError).toHaveBeenCalledExactlyOnceWith(
      "Something went wrong. Please try again.",
    );
  });

  it("does not report an error with a known message mapping", () => {
    appToast.error(Object.assign(new Error("known"), { code: API_ERROR_CODES.networkUnavailable }));

    expect(mocks.reportClientError).not.toHaveBeenCalled();
    expect(mocks.toastError).toHaveBeenCalledExactlyOnceWith(
      "We could not reach the server. Check your connection and try again.",
    );
  });

  it("reports an unexpected API error even though it has a fallback message", () => {
    const error = Object.assign(new Error("unexpected"), {
      code: API_ERROR_CODES.unexpected,
      requestId: "server-request-id",
    });

    appToast.error(error);

    expect(mocks.reportClientError).toHaveBeenCalledExactlyOnceWith(error);
    expect(mocks.toastError).toHaveBeenCalledExactlyOnceWith(
      "Something went wrong. Please try again.",
    );
  });
});
