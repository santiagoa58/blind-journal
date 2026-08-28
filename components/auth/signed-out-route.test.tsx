// @vitest-environment jsdom

import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAppSession } from "@/client-state/app-session.state";
import { SignedOutRoute } from "@/components/auth/signed-out-route";

const mocks = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

beforeEach(() => {
  useAppSession.setState({ initialized: true, session: { status: "signed-out" } });
});

describe("SignedOutRoute", () => {
  it("renders for a signed-out session and redirects after the session unlocks", async () => {
    render(
      <SignedOutRoute>
        <div>{"Sign in"}</div>
      </SignedOutRoute>,
    );

    expect(screen.getByText("Sign in")).toBeDefined();
    expect(mocks.replace).not.toHaveBeenCalled();

    await act(async () => {
      useAppSession.getState().unlock({
        id: "user-one",
        username: "writer",
        displayName: "Writer",
        keyEncryptionKey: {} as CryptoKey,
      });
    });

    expect(screen.queryByText("Sign in")).toBeNull();
    expect(mocks.replace).toHaveBeenCalledExactlyOnceWith("/journal");
  });
});
