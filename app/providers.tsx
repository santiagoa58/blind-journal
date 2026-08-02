"use client";

import { Theme } from "@radix-ui/themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { type PropsWithChildren, useState } from "react";
import { MockServiceWorkerProvider } from "@/mocks/mock-service-worker-provider";

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
      <Theme accentColor="iris" radius="full">
        <MockServiceWorkerProvider>
          <QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>
        </MockServiceWorkerProvider>
      </Theme>
    </ThemeProvider>
  );
}
