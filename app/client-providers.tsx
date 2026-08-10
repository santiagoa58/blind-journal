"use client";

import { Theme } from "@radix-ui/themes";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { type PropsWithChildren, useState } from "react";
import { Toaster } from "sonner";
import { useAppToast } from "@/hooks/use-app-toast";

export function Providers(props: PropsWithChildren) {
  const appToast = useAppToast();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        mutationCache: new MutationCache({
          onError: appToast.error,
        }),
        queryCache: new QueryCache({
          onError(error, query) {
            if (query.state.data !== undefined) {
              appToast.error(error);
            }
          },
        }),
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
