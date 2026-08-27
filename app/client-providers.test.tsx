// @vitest-environment jsdom

import { MutationObserver, type QueryClient, useQueryClient } from "@tanstack/react-query";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AUTH_ERROR_CODES } from "@/api/auth/auth.error";
import { Providers } from "@/app/client-providers";
import { useAppSession } from "@/client-state/app-session.state";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@radix-ui/themes", () => ({
  Theme: ({ children }: React.PropsWithChildren) => children,
}));
vi.mock("next-themes", () => ({
  ThemeProvider: ({ children }: React.PropsWithChildren) => children,
}));
vi.mock("sonner", () => ({ Toaster: () => null }));
vi.mock("@/components/auth/app-lock-boundary", () => ({
  AppLockBoundary: ({ children }: React.PropsWithChildren) => children,
}));
vi.mock("@/hooks/use-app-toast", () => ({
  useAppToast: () => ({ error: mocks.toastError }),
}));
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

let container: HTMLDivElement;
let queryClient: QueryClient;
let root: Root;

function Harness() {
  queryClient = useQueryClient();
  return null;
}

function unauthorizedError() {
  return Object.assign(new Error("server session expired"), {
    code: AUTH_ERROR_CODES.unauthorized,
  });
}

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  useAppSession.setState({
    initialized: true,
    session: {
      status: "unlocked",
      user: {
        id: "user-one",
        username: "writer",
        displayName: "Writer",
        keyEncryptionKey: {} as CryptoKey,
      },
    },
  });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);

  await act(async () => {
    root.render(
      <Providers>
        <Harness />
      </Providers>,
    );
  });

  queryClient.setQueryData(["journal", "entries", "user-one"], {
    entries: [{ content: "private journal plaintext" }],
  });
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

describe("Providers", () => {
  it("clears the client session and private cache before replacing the route on a query 401", async () => {
    await expect(
      queryClient.fetchQuery({
        queryKey: ["journal", "unauthorized-query"],
        queryFn: () => Promise.reject(unauthorizedError()),
        retry: false,
      }),
    ).rejects.toMatchObject({ code: AUTH_ERROR_CODES.unauthorized });

    expect(useAppSession.getState().session.status).toBe("signed-out");
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    expect(queryClient.getMutationCache().getAll()).toHaveLength(0);
    expect(mocks.replace).toHaveBeenCalledExactlyOnceWith("/");
    expect(mocks.toastError).not.toHaveBeenCalled();

    queryClient.setQueryData(["journal", "late-plaintext"], { content: "late plaintext" });
    await expect(
      queryClient.fetchQuery({
        queryKey: ["journal", "second-unauthorized-query"],
        queryFn: () => Promise.reject(unauthorizedError()),
        retry: false,
      }),
    ).rejects.toMatchObject({ code: AUTH_ERROR_CODES.unauthorized });

    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    expect(mocks.replace).toHaveBeenCalledExactlyOnceWith("/");
  });

  it("clears the client session and private cache before replacing the route on a mutation 401", async () => {
    const mutation = new MutationObserver(queryClient, {
      mutationFn: () => Promise.reject(unauthorizedError()),
    });

    await expect(mutation.mutate()).rejects.toMatchObject({
      code: AUTH_ERROR_CODES.unauthorized,
    });

    expect(useAppSession.getState().session.status).toBe("signed-out");
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    expect(queryClient.getMutationCache().getAll()).toHaveLength(0);
    expect(mocks.replace).toHaveBeenCalledExactlyOnceWith("/");
    expect(mocks.toastError).not.toHaveBeenCalled();
  });
});
