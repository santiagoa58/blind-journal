// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppSessionInitializerClient, useAppSession } from "@/client-state/app-session.state";

let container: HTMLDivElement;
let root: Root;

function LocaleSubtree({ locale }: { locale: string }) {
  const status = useAppSession((state) => state.session.status);
  return <output>{`${locale}:${status}`}</output>;
}

function renderLocale(locale: string) {
  root.render(
    <AppSessionInitializerClient
      initialSession={{
        status: "locked",
        user: { id: "user-one", username: "writer", displayName: "Writer" },
      }}
    >
      <LocaleSubtree key={locale} locale={locale} />
    </AppSessionInitializerClient>,
  );
}

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  useAppSession.setState({ initialized: false, session: { status: "signed-out" } });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

describe("AppSessionInitializer", () => {
  it("initializes once and preserves the unlocked key when the locale subtree remounts", async () => {
    await act(async () => renderLocale("en"));

    await act(async () => {
      useAppSession.getState().unlock({
        id: "user-one",
        username: "writer",
        displayName: "Writer",
        keyEncryptionKey: {} as CryptoKey,
      });
    });
    expect(container.textContent).toBe("en:unlocked");

    await act(async () => renderLocale("es"));

    expect(container.textContent).toBe("es:unlocked");
  });
});
