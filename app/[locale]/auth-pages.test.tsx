import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import Home from "@/app/[locale]/page";
import SignUpPage from "@/app/[locale]/sign-up/page";

vi.mock("next-intl/server", () => ({ setRequestLocale: vi.fn() }));
vi.mock("@/components/auth/auth-shell", () => ({
  AuthShell: ({ children }: React.PropsWithChildren) => <div data-auth-shell>{children}</div>,
}));
vi.mock("@/components/auth/create-account-card", () => ({
  CreateAccountCard: () => <div data-create-account-card />,
}));
vi.mock("@/components/auth/login-card", () => ({
  LoginCard: () => <div data-login-card />,
}));
vi.mock("@/components/auth/signed-out-route", () => ({
  SignedOutRoute: ({ children }: React.PropsWithChildren) => (
    <div data-signed-out-route>{children}</div>
  ),
}));

describe("authentication pages", () => {
  it("places the login page behind the signed-out route boundary", async () => {
    const page = await Home({ params: Promise.resolve({ locale: "en" }) });
    const markup = renderToStaticMarkup(page);

    expect(markup).toContain("data-signed-out-route");
    expect(markup).toContain("data-login-card");
  });

  it("places account creation behind the signed-out route boundary", async () => {
    const page = await SignUpPage({ params: Promise.resolve({ locale: "es" }) });
    const markup = renderToStaticMarkup(page);

    expect(markup).toContain("data-signed-out-route");
    expect(markup).toContain("data-create-account-card");
  });
});
