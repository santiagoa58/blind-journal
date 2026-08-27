// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

let container: HTMLDivElement;
let root: Root;
let startJournalSession: ReturnType<typeof useStartJournalSession>;

function Harness() {
  startJournalSession = useStartJournalSession();
  return null;
}

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  useAppSession.setState({ initialized: true, session: { status: "signed-out" } });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(<Harness />));
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

describe("useStartJournalSession", () => {
  it("stores the in-memory key before entering the journal", async () => {
    await act(async () => startJournalSession(USER));

    expect(useAppSession.getState().session).toEqual({ status: "unlocked", user: USER });
    expect(mocks.replace).toHaveBeenCalledExactlyOnceWith("/journal");
  });
});
