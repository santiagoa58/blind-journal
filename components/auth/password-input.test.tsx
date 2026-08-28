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

    expect(input).toHaveAttribute("type", "password");
    expect(toggle).toHaveAttribute("type", "button");
    expect(toggle).toHaveAttribute("aria-controls", "password");

    await user.click(toggle);

    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveValue("correct horse");
    expect(screen.getByRole("button", { name: "Hide passphrase" })).toBe(toggle);

    await user.click(toggle);

    expect(input).toHaveAttribute("type", "password");
    expect(input).toHaveValue("correct horse");
  });
});
