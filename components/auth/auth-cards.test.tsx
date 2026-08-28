// @vitest-environment jsdom

import { Theme } from "@radix-ui/themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClientUser } from "@/api/auth/user.type";
import { CreateAccountCard } from "./create-account-card";
import { LoginCard } from "./login-card";
import { UnlockCard } from "./unlock-card";

const mocks = vi.hoisted(() => ({
  createAccount: vi.fn(),
  login: vi.fn(),
  signOut: vi.fn(),
  startJournalSession: vi.fn(),
  success: vi.fn(),
  unlock: vi.fn(),
}));

vi.mock("@/api/auth/auth", () => ({
  createAccount: mocks.createAccount,
  login: mocks.login,
}));
vi.mock("@/client-state/app-session.state", () => ({
  useAppSession: (select: (state: { unlock: typeof mocks.unlock }) => unknown) =>
    select({ unlock: mocks.unlock }),
}));
vi.mock("@/hooks/use-app-toast", () => ({
  useAppToast: () => ({ error: vi.fn(), success: mocks.success }),
}));
vi.mock("@/hooks/use-logout", () => ({
  useLogout: () => ({ signOut: mocks.signOut }),
}));
vi.mock("@/hooks/use-start-journal-session", () => ({
  useStartJournalSession: () => mocks.startJournalSession,
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const USER = {
  id: "user-one",
  username: "journal-user",
  displayName: "Journal User",
  keyEncryptionKey: {} as CryptoKey,
} satisfies ClientUser;
const PASSPHRASE = "correct horse battery staple";

function renderCard(card: ReactNode) {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <Theme>{card}</Theme>
    </QueryClientProvider>,
  );
  return queryClient;
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("authentication cards", () => {
  it("creates an account once and starts the journal session after completion", async () => {
    const user = userEvent.setup();
    const accountCreation = Promise.withResolvers<ClientUser>();
    mocks.createAccount.mockReturnValueOnce(accountCreation.promise);
    renderCard(<CreateAccountCard />);

    await user.type(
      screen.getByRole("textbox", { name: "createAccount.usernameLabel" }),
      USER.username,
    );
    await user.type(screen.getByLabelText("createAccount.passwordLabel"), PASSPHRASE);
    await user.type(screen.getByLabelText("createAccount.confirmPasswordLabel"), PASSPHRASE);
    const submit = screen.getByRole<HTMLButtonElement>("button", {
      name: "createAccount.submit",
    });
    await user.click(submit);

    expect(mocks.createAccount).toHaveBeenCalledOnce();
    expect(mocks.createAccount.mock.calls[0]?.[0]).toEqual({
      username: USER.username,
      password: PASSPHRASE,
      confirmPassword: PASSPHRASE,
    });
    await waitFor(() => expect(submit).toBeDisabled());
    await user.click(submit);
    expect(mocks.createAccount).toHaveBeenCalledOnce();
    expect(mocks.startJournalSession).not.toHaveBeenCalled();

    accountCreation.resolve(USER);
    await waitFor(() => expect(mocks.startJournalSession).toHaveBeenCalledExactlyOnceWith(USER));
    expect(mocks.success).toHaveBeenCalledExactlyOnceWith("success.accountCreated");
  });

  it("signs in with the entered credentials without retaining them in the mutation cache", async () => {
    const user = userEvent.setup();
    mocks.login.mockResolvedValueOnce(USER);
    const queryClient = renderCard(<LoginCard />);

    await user.type(screen.getByRole("textbox", { name: "signIn.usernameLabel" }), USER.username);
    await user.type(screen.getByLabelText("signIn.passwordLabel"), PASSPHRASE);
    await user.click(screen.getByRole("button", { name: "signIn.submit" }));

    await waitFor(() => expect(mocks.login).toHaveBeenCalledOnce());
    expect(mocks.login.mock.calls[0]?.[0]).toEqual({
      username: USER.username,
      password: PASSPHRASE,
    });
    expect(mocks.startJournalSession).toHaveBeenCalledExactlyOnceWith(USER);
    expect(mocks.success).toHaveBeenCalledExactlyOnceWith("success.signedIn");
    await waitFor(() => expect(queryClient.getMutationCache().getAll()).toHaveLength(0));
  });

  it("unlocks the current account and keeps sign-out available as the alternate action", async () => {
    const user = userEvent.setup();
    mocks.login.mockResolvedValueOnce(USER);
    renderCard(<UnlockCard user={USER} />);

    await user.type(screen.getByLabelText("unlock.passwordLabel"), PASSPHRASE);
    await user.click(screen.getByRole("button", { name: "unlock.submit" }));

    await waitFor(() =>
      expect(mocks.login).toHaveBeenCalledExactlyOnceWith({
        username: USER.username,
        password: PASSPHRASE,
      }),
    );
    expect(mocks.unlock).toHaveBeenCalledExactlyOnceWith(USER);
    expect(mocks.success).toHaveBeenCalledExactlyOnceWith("success.unlocked");

    await user.click(screen.getByRole("button", { name: "unlock.signOut" }));
    expect(mocks.signOut).toHaveBeenCalledOnce();
  });
});
