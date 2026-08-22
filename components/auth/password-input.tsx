"use client";

import { EyeClosedIcon, EyeOpenIcon, LockClosedIcon } from "@radix-ui/react-icons";
import { IconButton } from "@radix-ui/themes";
import { useState } from "react";
import { LabeledInput, type LabeledInputProps } from "./labeled-input";

interface PasswordInputProps extends Omit<LabeledInputProps, "children" | "endAdornment" | "type"> {
  hidePasswordLabel: string;
  showPasswordLabel: string;
}

export function PasswordInput({
  disabled,
  hidePasswordLabel,
  name,
  showPasswordLabel,
  ...inputProps
}: PasswordInputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const toggleLabel = isPasswordVisible ? hidePasswordLabel : showPasswordLabel;

  return (
    <LabeledInput
      {...inputProps}
      disabled={disabled}
      name={name}
      type={isPasswordVisible ? "text" : "password"}
      endAdornment={
        <IconButton
          type="button"
          size="2"
          variant="ghost"
          color="gray"
          aria-controls={name}
          aria-label={toggleLabel}
          title={toggleLabel}
          disabled={disabled}
          onPointerDown={(event) => {
            // Keep the input focused so the user can continue typing after toggling visibility.
            event.preventDefault();
          }}
          onClick={() => setIsPasswordVisible((isVisible) => !isVisible)}
        >
          {isPasswordVisible ? <EyeOpenIcon aria-hidden /> : <EyeClosedIcon aria-hidden />}
        </IconButton>
      }
    >
      <LockClosedIcon aria-hidden />
    </LabeledInput>
  );
}
