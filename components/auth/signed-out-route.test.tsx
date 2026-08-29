// @vitest-environment jsdom

import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useAppSession } from "@/client-state/app-session.state";
import { SignedOutRoute } from "@/components/auth/signed-out-route";

beforeEach(() => {
  useAppSession.setState({ initialized: true, session: { status: "signed-out" } });
});

describe("SignedOutRoute", () => {
  it("renders only while the session is signed out", async () => {
    render(
      <SignedOutRoute>
        <div>{"Sign in"}</div>
      </SignedOutRoute>,
    );

    expect(screen.getByText("Sign in")).toBeInTheDocument();

    await act(async () => {
      useAppSession.getState().unlock({
        id: "user-one",
        username: "writer",
        displayName: "Writer",
        keyEncryptionKey: {} as CryptoKey,
      });
    });

    expect(screen.queryByText("Sign in")).not.toBeInTheDocument();
  });
});
