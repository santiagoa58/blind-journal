// @vitest-environment jsdom

import { MutationObserver, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAppSession } from "@/client-state/app-session.state";
import { useLogout } from "@/hooks/use-logout";

const mocks = vi.hoisted(() => ({
  logout: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("@/api/auth/auth", () => ({ logout: mocks.logout }));
vi.mock("@/i18n/navigation", () => ({ useRouter: () => ({ replace: mocks.replace }) }));

let control: ReturnType<typeof useLogout>;
let queryClient: QueryClient;

beforeEach(async () => {
  useAppSession.setState({ initialized: true, session: { status: "signed-out" } });
  useAppSession.getState().unlock({
    id: "user-one",
    username: "user-one",
    displayName: "User One",
    keyEncryptionKey: {} as CryptoKey,
  });
  queryClient = new QueryClient();
  queryClient.setQueryData(["journal", "entries", "user-one"], {
    entries: [{ content: "private journal plaintext" }],
  });
  const privateMutation = new MutationObserver(queryClient, {
    mutationKey: ["journal", "write", "entry-one"],
    mutationFn: async (variables: { content: string }) => variables,
  });
  await privateMutation.mutate({ content: "private mutation plaintext" });

  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  control = renderHook(() => useLogout(), { wrapper }).result.current;
});

describe("useLogout", () => {
  it("clears private client state immediately while server revocation finishes", async () => {
    const remoteRevocation = Promise.withResolvers<null>();
    mocks.logout.mockReturnValueOnce(remoteRevocation.promise);

    await act(async () => {
      control.signOut();
      await vi.waitFor(() => expect(mocks.logout).toHaveBeenCalledOnce());
    });

    expect(useAppSession.getState().session.status).toBe("signed-out");
    expect(queryClient.getQueryData(["journal", "entries", "user-one"])).toBeUndefined();
    expect(mocks.replace).toHaveBeenCalledExactlyOnceWith("/");

    remoteRevocation.resolve(null);
    await act(async () => {
      await vi.waitFor(() =>
        expect(
          queryClient
            .getMutationCache()
            .getAll()
            .some((mutation) => mutation.state.status === "success"),
        ).toBe(true),
      );
    });

    expect(useAppSession.getState().session.status).toBe("signed-out");
    expect(queryClient.getQueryData(["journal", "entries", "user-one"])).toBeUndefined();
    expect(
      queryClient.getMutationCache().findAll({ mutationKey: ["journal"], exact: false }),
    ).toHaveLength(0);
  });

  it("keeps local keys and plaintext cleared when remote revocation fails", async () => {
    const remoteRevocation = Promise.withResolvers<null>();
    mocks.logout.mockReturnValueOnce(remoteRevocation.promise);

    await act(async () => control.signOut());
    remoteRevocation.reject(new Error("remote logout failed"));
    await act(async () => {
      await vi.waitFor(() =>
        expect(
          queryClient
            .getMutationCache()
            .getAll()
            .some((mutation) => mutation.state.status === "error"),
        ).toBe(true),
      );
    });

    expect(useAppSession.getState().session.status).toBe("signed-out");
    expect(queryClient.getQueryData(["journal", "entries", "user-one"])).toBeUndefined();
    expect(mocks.replace).toHaveBeenCalledExactlyOnceWith("/");
  });
});
