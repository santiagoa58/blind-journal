// @vitest-environment jsdom

import { MutationObserver, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLogout } from "@/hooks/use-logout";
import { useUser } from "@/state/user.state";

const mocks = vi.hoisted(() => ({
  logout: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("@/api/auth/auth", () => ({ logout: mocks.logout }));
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
  it("shows pending state until revocation succeeds, then clears the client session", async () => {
    const remoteRevocation = Promise.withResolvers<null>();
    mocks.logout.mockReturnValueOnce(remoteRevocation.promise);

    await act(async () => {
      control.signOut();
      await vi.waitFor(() => expect(mocks.logout).toHaveBeenCalledOnce());
    });

    expect(control.isPending).toBe(true);
    expect(useUser.getState().user).not.toBeNull();
    expect(queryClient.getQueryData(["journal", "entries", "user-one"])).toBeDefined();
    expect(mocks.replace).not.toHaveBeenCalled();

    remoteRevocation.resolve(null);
    await act(async () => {
      await vi.waitFor(() => expect(mocks.replace).toHaveBeenCalledExactlyOnceWith("/"));
    });

    expect(useUser.getState().user).toBeNull();
    expect(queryClient.getQueryData(["journal", "entries", "user-one"])).toBeUndefined();
    expect(queryClient.getMutationCache().findAll()).toHaveLength(0);
  });

  it("keeps the current session when revocation fails", async () => {
    const remoteRevocation = Promise.withResolvers<null>();
    mocks.logout.mockReturnValueOnce(remoteRevocation.promise);

    await act(async () => control.signOut());
    remoteRevocation.reject(new Error("remote logout failed"));
    await act(async () => {
      await vi.waitFor(() => expect(control.isPending).toBe(false));
    });

    expect(useUser.getState().user).not.toBeNull();
    expect(queryClient.getQueryData(["journal", "entries", "user-one"])).toBeDefined();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
