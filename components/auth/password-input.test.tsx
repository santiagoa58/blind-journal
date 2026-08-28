// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PasswordInput } from "./password-input";

describe("PasswordInput", () => {
  it("toggles the passphrase visibility with an accessible Radix slot button", async () => {
    const user = userEvent.setup();
    render(
      <PasswordInput
        label="Passphrase"
        name="password"
        defaultValue="correct horse"
        showPasswordLabel="Show passphrase"
        hidePasswordLabel="Hide passphrase"
      />,
    );

    const input = screen.getByLabelText<HTMLInputElement>("Passphrase");
    const toggle = screen.getByRole<HTMLButtonElement>("button", { name: "Show passphrase" });

    expect(input.type).toBe("password");
    expect(toggle.type).toBe("button");
    expect(toggle.getAttribute("aria-controls")).toBe("password");

    await user.click(toggle);

    expect(input.type).toBe("text");
    expect(input.value).toBe("correct horse");
    expect(screen.getByRole("button", { name: "Hide passphrase" })).toBe(toggle);

    await user.click(toggle);

    expect(input.type).toBe("password");
    expect(input.value).toBe("correct horse");
  });
});
