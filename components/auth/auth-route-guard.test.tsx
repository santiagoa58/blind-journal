// @vitest-environment jsdom

import { act, type PropsWithChildren } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthRouteGuard } from "@/components/auth/auth-route-guard";
import { useUser } from "@/state/user.state";

const mocks = vi.hoisted(() => ({ replace: vi.fn() }));
const AUTH_CONTENT = "Sign in";

vi.mock("@/i18n/navigation", () => ({ useRouter: () => ({ replace: mocks.replace }) }));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  mocks.replace.mockReset();
  useUser.getState().setUser(null);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  useUser.getState().setUser(null);
});

function Child({ children }: PropsWithChildren) {
  return <div>{children}</div>;
}

describe("AuthRouteGuard", () => {
  it("shows auth content without a session and owns the authenticated redirect", async () => {
    await act(async () => {
      root.render(
        <AuthRouteGuard>
          <Child>{AUTH_CONTENT}</Child>
        </AuthRouteGuard>,
      );
    });
    expect(container.textContent).toBe(AUTH_CONTENT);
    expect(mocks.replace).not.toHaveBeenCalled();

    await act(async () => {
      useUser.getState().setUser({
        id: "user-1",
        username: "writer",
        displayName: "writer",
        keyEncryptionKey: {} as CryptoKey,
      });
    });

    expect(container.textContent).toBe("");
    expect(mocks.replace).toHaveBeenCalledExactlyOnceWith("/journal");
  });
});
