// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ErrorPage from "@/app/[locale]/error";
import GlobalErrorPage from "@/app/global-error";
import { getErrorPageMessages } from "@/i18n/error-page-messages";

const mocks = vi.hoisted(() => ({ locale: "en" }));

vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: mocks.locale }),
}));

beforeEach(() => {
  mocks.locale = "en";
  vi.stubGlobal("reportError", vi.fn());
});

describe("route error boundaries", () => {
  it("renders the localized route error and retries", async () => {
    const error = new Error("route failed");
    const retry = vi.fn();
    const user = userEvent.setup();

    render(
      <NextIntlClientProvider locale="es" messages={getErrorPageMessages("es")}>
        <ErrorPage error={error} retry={retry} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole("heading", { name: "Algo salió mal" })).toBeVisible();
    expect(screen.getByText("No pudimos cargar esta página. Inténtalo de nuevo.")).toBeVisible();
    expect(globalThis.reportError).toHaveBeenCalledExactlyOnceWith(error);

    await user.click(screen.getByRole("button", { name: "Intentar de nuevo" }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it("falls back to English when the global boundary receives an unsupported locale", async () => {
    mocks.locale = "unsupported";
    const error = new Error("root layout failed");
    const retry = vi.fn();
    const user = userEvent.setup();

    render(<GlobalErrorPage error={error} retry={retry} />);

    expect(screen.getByRole("heading", { name: "Something went wrong" })).toBeVisible();
    expect(screen.getByText("We couldn't load this page. Try again.")).toBeVisible();
    expect(globalThis.reportError).toHaveBeenCalledExactlyOnceWith(error);

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
