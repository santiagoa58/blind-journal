"use client";

import { Theme } from "@radix-ui/themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { type PropsWithChildren, useState } from "react";
import { Toaster } from "sonner";

export function Providers(props: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          mutations: {
            retry: false,
          },
          queries: {
            retry: 1,
            staleTime: 30_000,
          },
        },
      }),
  );

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
