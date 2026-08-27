// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAppSession } from "@/client-state/app-session.state";
import { SignedOutRoute } from "@/components/auth/signed-out-route";

const mocks = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  useAppSession.setState({ initialized: true, session: { status: "signed-out" } });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

describe("SignedOutRoute", () => {
  it("renders for a signed-out session and redirects after the session unlocks", async () => {
    await act(async () => {
      root.render(
        <SignedOutRoute>
          <div>{"Sign in"}</div>
        </SignedOutRoute>,
      );
    });

    expect(container.textContent).toBe("Sign in");
    expect(mocks.replace).not.toHaveBeenCalled();

    await act(async () => {
      useAppSession.getState().unlock({
        id: "user-one",
        username: "writer",
        displayName: "Writer",
        keyEncryptionKey: {} as CryptoKey,
      });
    });

    expect(container.textContent).toBe("");
    expect(mocks.replace).toHaveBeenCalledExactlyOnceWith("/journal");
  });
});
