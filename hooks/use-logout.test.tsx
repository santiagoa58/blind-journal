// @vitest-environment jsdom

import { MutationObserver, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { Action, ExternalToast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logoutErrorToastId, logoutMutationKey } from "@/hooks/logout-mutation";
import { useLogout } from "@/hooks/use-logout";
import { useJournalWorkspace } from "@/state/journal-workspace.state";
import { useUser } from "@/state/user.state";

const mocks = vi.hoisted(() => ({
  dismiss: vi.fn(),
  error: vi.fn(),
  logout: vi.fn(),
  replace: vi.fn(),
  terminateAuthWorkerClient: vi.fn(),
}));

vi.mock("@/api/auth/auth", () => ({ logout: mocks.logout }));
vi.mock("@/api/auth/auth-worker-client", () => ({
  terminateAuthWorkerClient: mocks.terminateAuthWorkerClient,
}));
vi.mock("@/hooks/use-app-toast", () => ({
  useAppToast: () => ({ dismiss: mocks.dismiss, error: mocks.error, success: vi.fn() }),
}));
vi.mock("@/i18n/navigation", () => ({ useRouter: () => ({ replace: mocks.replace }) }));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));

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
  useUser.getState().setUser({
    id: "user-one",
    username: "user-one",
    displayName: "User One",
    keyEncryptionKey: {} as CryptoKey,
  });
  useJournalWorkspace.getState().reset();
  useJournalWorkspace.getState().selectSection("favorites");
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
  useJournalWorkspace.getState().reset();
  container.remove();
});

describe("useLogout", () => {
  it("locks locally before remote revocation and keeps a failed revocation retryable", async () => {
    const remoteRevocation = Promise.withResolvers<null>();
    mocks.logout.mockReturnValueOnce(remoteRevocation.promise).mockResolvedValueOnce(null);
    let signOut: Promise<void> | undefined;

    await act(async () => {
      signOut = control.signOut();
      await vi.waitFor(() => expect(mocks.logout).toHaveBeenCalledOnce());
    });

    expect(mocks.terminateAuthWorkerClient).toHaveBeenCalledOnce();
    expect(useUser.getState().user).toBeNull();
    expect(useJournalWorkspace.getState()).toMatchObject({
      activeSection: "journal",
      selectedEntryId: undefined,
    });
    expect(queryClient.getQueryData(["journal", "entries", "user-one"])).toBeUndefined();
    expect(queryClient.getMutationCache().findAll({ mutationKey: ["journal"] })).toHaveLength(0);
    expect(mocks.replace).toHaveBeenCalledExactlyOnceWith("/");

    const error = new Error("remote logout failed");
    remoteRevocation.reject(error);
    await act(async () => signOut);

    expect(mocks.error).toHaveBeenCalledOnce();
    const [reportedError, options] = mocks.error.mock.calls[0] as [Error, ExternalToast];
    expect(reportedError).toBe(error);
    expect(options).toMatchObject({
      dismissible: false,
      duration: Number.POSITIVE_INFINITY,
      id: logoutErrorToastId,
    });

    const action = options.action as Action;
    await act(async () => {
      action.onClick({} as Parameters<Action["onClick"]>[0]);
      await vi.waitFor(() => expect(mocks.logout).toHaveBeenCalledTimes(2));
      await vi.waitFor(() => expect(mocks.dismiss).toHaveBeenCalledWith(logoutErrorToastId));
    });

    expect(useUser.getState().user).toBeNull();
    expect(
      queryClient.getMutationCache().findAll({ mutationKey: logoutMutationKey, exact: true }),
    ).toHaveLength(0);
  });
});
