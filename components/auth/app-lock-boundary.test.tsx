// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  useAppSession.setState({
    initialized: true,
    session: {
      status: "locked",
      user: { id: "user-one", username: "writer", displayName: "Writer" },
    },
  });
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

describe("AppLockBoundary", () => {
  it("globally replaces application pages until the session has an in-memory key", async () => {
    await act(async () => {
      root.render(
        <AppLockBoundary>
          <div>{PAGE_CONTENT}</div>
        </AppLockBoundary>,
      );
    });

    expect(container.textContent).toBe(LOCK_CONTENT);
    expect(container.querySelector("[data-auth-shell]")).not.toBeNull();

    await act(async () => {
      useAppSession.getState().unlock({
        id: "user-one",
        username: "writer",
        displayName: "Writer",
        keyEncryptionKey: {} as CryptoKey,
      });
    });

    expect(container.textContent).toBe(PAGE_CONTENT);
    expect(container.querySelector("[data-auth-shell]")).toBeNull();
  });
});
