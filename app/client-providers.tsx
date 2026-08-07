"use client";

import { Theme } from "@radix-ui/themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import type { PropsWithChildren } from "react";
import { Toaster } from "sonner";

const queryClient = new QueryClient();
export function Providers(props: PropsWithChildren) {
  return (
    <ThemeProvider attribute="class">
      <Theme accentColor="iris" grayColor="slate" radius="large" panelBackground="translucent">
        <QueryClientProvider client={queryClient}>
          {props.children}
          <Toaster position="bottom-right" richColors theme="system" />
        </QueryClientProvider>
      </Theme>
    </ThemeProvider>
  );
}
