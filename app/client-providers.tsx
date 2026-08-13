"use client";

import { Theme } from "@radix-ui/themes";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { type PropsWithChildren, useState } from "react";
import { Toaster } from "sonner";
import { useAppToast } from "@/hooks/use-app-toast";

type ProvidersProps = PropsWithChildren<{ nonce?: string | undefined }>;

export function Providers({ children, nonce }: ProvidersProps) {
  const appToast = useAppToast();
  // TODO(review-high-expired-session-local-lock): Global AUTH_UNAUTHORIZED failures currently show
  // a toast but leave the unlocked CryptoKey, decrypted Query data, and workspace state in memory.
  // A revoked or expired server session must trigger the same atomic local-lock transition as
  // logout before redirecting; otherwise private data remains visible indefinitely in the open tab.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        mutationCache: new MutationCache({
          onError(error, _variables, _onMutateResult, mutation) {
            if (mutation.meta?.["suppressGlobalErrorToast"] !== true) {
              appToast.error(error);
            }
          },
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
    <ThemeProvider attribute="class" {...(nonce ? { nonce } : {})}>
      <Theme accentColor="iris" grayColor="slate" radius="large" panelBackground="translucent">
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster position="bottom-right" richColors theme="system" />
        </QueryClientProvider>
      </Theme>
    </ThemeProvider>
  );
}
