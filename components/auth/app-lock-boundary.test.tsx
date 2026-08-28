// @vitest-environment jsdom

import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAppSession } from "@/client-state/app-session.state";
import { AppLockBoundary } from "@/components/auth/app-lock-boundary";

const LOCK_CONTENT = "Unlock journal";
const PAGE_CONTENT = "Private application page";

vi.mock("@/components/auth/auth-shell", () => ({
  AuthShell: ({ children }: React.PropsWithChildren) => <div data-auth-shell>{children}</div>,
}));
vi.mock("@/components/auth/unlock-card", () => ({
  UnlockCard: () => <div>{"Unlock journal"}</div>,
}));

beforeEach(() => {
  useAppSession.setState({
    initialized: true,
    session: {
      status: "locked",
      user: { id: "user-one", username: "writer", displayName: "Writer" },
    },
  });
});

describe("AppLockBoundary", () => {
  it("globally replaces application pages until the session has an in-memory key", async () => {
    render(
      <AppLockBoundary>
        <div>{PAGE_CONTENT}</div>
      </AppLockBoundary>,
    );

    expect(screen.getByText(LOCK_CONTENT)).toBeInTheDocument();
    expect(screen.queryByText(PAGE_CONTENT)).not.toBeInTheDocument();

    await act(async () => {
      useAppSession.getState().unlock({
        id: "user-one",
        username: "writer",
        displayName: "Writer",
        keyEncryptionKey: {} as CryptoKey,
      });
    });

    expect(screen.getByText(PAGE_CONTENT)).toBeInTheDocument();
    expect(screen.queryByText(LOCK_CONTENT)).not.toBeInTheDocument();
  });
});
