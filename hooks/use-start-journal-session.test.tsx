// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClientUser } from "@/api/auth/user.type";
import { useAppSession } from "@/client-state/app-session.state";
import { useStartJournalSession } from "@/hooks/use-start-journal-session";

const mocks = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

const USER: ClientUser = {
  id: "user-one",
  username: "writer",
  displayName: "Writer",
  keyEncryptionKey: {} as CryptoKey,
};

beforeEach(() => {
  useAppSession.setState({ initialized: true, session: { status: "signed-out" } });
});

describe("useStartJournalSession", () => {
  it("stores the in-memory key before entering the journal", async () => {
    const { result } = renderHook(() => useStartJournalSession());
    mocks.replace.mockImplementationOnce(() => {
      expect(useAppSession.getState().session).toEqual({ status: "unlocked", user: USER });
    });

    act(() => result.current(USER));

    expect(mocks.replace).toHaveBeenCalledExactlyOnceWith("/journal");
  });
});
