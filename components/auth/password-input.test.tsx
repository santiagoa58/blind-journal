// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PasswordInput } from "./password-input";

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

describe("PasswordInput", () => {
  it("toggles the passphrase visibility with an accessible Radix slot button", async () => {
    await act(async () => {
      root.render(
        <PasswordInput
          label="Passphrase"
          name="password"
          defaultValue="correct horse"
          showPasswordLabel="Show passphrase"
          hidePasswordLabel="Hide passphrase"
        />,
      );
    });

    const input = container.querySelector<HTMLInputElement>("input");
    const toggle = container.querySelector<HTMLButtonElement>("button");

    expect(input?.type).toBe("password");
    expect(toggle?.type).toBe("button");
    expect(toggle?.getAttribute("aria-controls")).toBe("password");
    expect(toggle?.getAttribute("aria-label")).toBe("Show passphrase");
    expect(toggle?.parentElement?.dataset["side"]).toBe("right");

    await act(async () => toggle?.click());

    expect(input?.type).toBe("text");
    expect(input?.value).toBe("correct horse");
    expect(toggle?.getAttribute("aria-label")).toBe("Hide passphrase");

    await act(async () => toggle?.click());

    expect(input?.type).toBe("password");
    expect(input?.value).toBe("correct horse");
  });
});
