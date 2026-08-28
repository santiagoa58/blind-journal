"use client";

import { Theme } from "@radix-ui/themes";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { type PropsWithChildren, useState } from "react";
import { Toaster } from "sonner";
import { clearClientSession } from "@/client-state/client-session";
import { AppLockBoundary } from "@/components/auth/app-lock-boundary";
import { useAppToast } from "@/hooks/use-app-toast";
import { useRouter } from "@/i18n/navigation";
import { AUTH_ERROR_CODES } from "@/lib/api/auth/auth.error";
import { isCodedError } from "@/lib/client.error";

type ProvidersProps = PropsWithChildren<{ nonce?: string | undefined }>;

export function Providers({ children, nonce }: ProvidersProps) {
  const appToast = useAppToast();
  const router = useRouter();
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      mutationCache: new MutationCache({
        onError(error) {
          if (handleUnauthorizedError(error)) {
            return;
          }
          appToast.error(error);
        },
      }),
      queryCache: new QueryCache({
        onError(error, query) {
          if (handleUnauthorizedError(error)) {
            return;
          }
          if (query.state.data !== undefined) {
            appToast.error(error);
          }
        },
      }),
    });

    function handleUnauthorizedError(error: Error): boolean {
      if (!isCodedError(error) || error.code !== AUTH_ERROR_CODES.unauthorized) {
        return false;
      }

      // A 401 means the server and client sessions have diverged. The first failing request owns
      // the route transition; concurrent failures still clear anything they may have cached.
      if (clearClientSession(client)) {
        router.replace("/");
      }

      return true;
    }

    return client;
  });

  return (
    <ThemeProvider attribute="class" {...(nonce ? { nonce } : {})}>
      <Theme accentColor="iris" grayColor="slate" radius="large" panelBackground="translucent">
        <QueryClientProvider client={queryClient}>
          <AppLockBoundary>{children}</AppLockBoundary>
          <Toaster position="bottom-right" richColors theme="system" />
        </QueryClientProvider>
      </Theme>
    </ThemeProvider>
  );
}
