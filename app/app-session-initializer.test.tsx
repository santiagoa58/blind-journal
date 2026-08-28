// @vitest-environment jsdom

import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { AppSessionInitializerClient, useAppSession } from "@/client-state/app-session.state";

function LocaleSubtree({ locale }: { locale: string }) {
  const status = useAppSession((state) => state.session.status);
  return <output>{`${locale}:${status}`}</output>;
}

function localeTree(locale: string) {
  return (
    <AppSessionInitializerClient
      initialSession={{
        status: "locked",
        user: { id: "user-one", username: "writer", displayName: "Writer" },
      }}
    >
      <LocaleSubtree key={locale} locale={locale} />
    </AppSessionInitializerClient>
  );
}

beforeEach(() => {
  useAppSession.setState({ initialized: false, session: { status: "signed-out" } });
});

describe("AppSessionInitializer", () => {
  it("initializes once and preserves the unlocked key when the locale subtree remounts", async () => {
    const view = render(localeTree("en"));

    await act(async () => {
      useAppSession.getState().unlock({
        id: "user-one",
        username: "writer",
        displayName: "Writer",
        keyEncryptionKey: {} as CryptoKey,
      });
    });
    expect(screen.getByText("en:unlocked")).toBeDefined();

    view.rerender(localeTree("es"));

    expect(screen.getByText("es:unlocked")).toBeDefined();
  });
});
