"use client";

import { Theme } from "@radix-ui/themes";
import { ThemeProvider } from "next-themes";
import type { PropsWithChildren } from "react";

type AppThemeProviderProps = PropsWithChildren<{ nonce?: string | undefined }>;

export function AppThemeProvider({ children, nonce }: AppThemeProviderProps) {
  return (
    <ThemeProvider attribute="class" {...(nonce ? { nonce } : {})}>
      <Theme accentColor="iris" grayColor="slate" radius="large" panelBackground="translucent">
        {children}
      </Theme>
    </ThemeProvider>
  );
}
