// @vitest-environment jsdom

import { MutationObserver, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLogout } from "@/hooks/use-logout";
import { useUser } from "@/state/user.state";

const mocks = vi.hoisted(() => ({
  error: vi.fn(),
  logout: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("@/api/auth/auth", () => ({ logout: mocks.logout }));
vi.mock("@/hooks/use-app-toast", () => ({
  useAppToast: () => ({ error: mocks.error, success: vi.fn() }),
}));
vi.mock("@/i18n/navigation", () => ({ useRouter: () => ({ replace: mocks.replace }) }));

let container: HTMLDivElement;
let control: ReturnType<typeof useLogout>;
let queryClient: QueryClient;
let root: Root;

function Harness() {
  control = useLogout();
  return null;
}

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.clearAllMocks();
  useUser.getState().setUser({
    id: "user-one",
    username: "user-one",
    displayName: "User One",
    keyEncryptionKey: {} as CryptoKey,
  });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  queryClient = new QueryClient();
  queryClient.setQueryData(["journal", "entries", "user-one"], {
    entries: [{ content: "private journal plaintext" }],
  });
  const privateMutation = new MutationObserver(queryClient, {
    mutationKey: ["journal", "write", "entry-one"],
    mutationFn: async (variables: { content: string }) => variables,
  });
  await privateMutation.mutate({ content: "private mutation plaintext" });

  await act(async () => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <Harness />
      </QueryClientProvider>,
    );
  });
});

afterEach(async () => {
  await act(async () => root.unmount());
  useUser.getState().setUser(null);
  container.remove();
});

describe("useLogout", () => {
  it("clears session-owned client state before remote revocation settles", async () => {
    const remoteRevocation = Promise.withResolvers<null>();
    mocks.logout.mockReturnValueOnce(remoteRevocation.promise);
    let signOut: Promise<void> | undefined;

    await act(async () => {
      signOut = control.signOut();
      await vi.waitFor(() => expect(mocks.logout).toHaveBeenCalledOnce());
    });

    expect(useUser.getState().user).toBeNull();
    expect(queryClient.getQueryData(["journal", "entries", "user-one"])).toBeUndefined();
    expect(queryClient.getMutationCache().findAll({ mutationKey: ["journal"] })).toHaveLength(0);
    expect(mocks.replace).toHaveBeenCalledExactlyOnceWith("/");

    const error = new Error("remote logout failed");
    remoteRevocation.reject(error);
    await act(async () => signOut);

    expect(mocks.error).toHaveBeenCalledExactlyOnceWith(error);
  });
});
