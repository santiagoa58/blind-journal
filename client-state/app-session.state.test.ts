import { beforeEach, describe, expect, it } from "vitest";
import { useAppSession } from "@/client-state/app-session.state";

const user = {
  id: "user-one",
  username: "writer",
  displayName: "Writer",
  keyEncryptionKey: {} as CryptoKey,
};

describe("app session state", () => {
  beforeEach(() => {
    useAppSession.setState({ initialized: false, session: { status: "signed-out" } });
  });

  it("initializes once and moves between signed out and unlocked", () => {
    useAppSession.getState().initialize({
      status: "locked",
      user: { id: user.id, username: user.username, displayName: user.displayName },
    });
    expect(useAppSession.getState().session.status).toBe("locked");

    useAppSession.getState().unlock(user);
    expect(useAppSession.getState().session).toEqual({ status: "unlocked", user });

    useAppSession.getState().initialize({
      status: "locked",
      user: { id: "other-user", username: "other", displayName: "Other" },
    });
    expect(useAppSession.getState().session).toEqual({ status: "unlocked", user });

    useAppSession.getState().signOut();
    expect(useAppSession.getState().session).toEqual({ status: "signed-out" });
  });
});
