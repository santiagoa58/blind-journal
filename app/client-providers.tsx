"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type PropsWithChildren, useState } from "react";
import { Toaster } from "sonner";
import { clearClientSession } from "@/client-state/client-session";
import { useAppToast } from "@/hooks/use-app-toast";
import { useRouter } from "@/i18n/navigation";
import { AUTH_ERROR_CODES } from "@/lib/api/auth/auth.error";
import { isCodedError } from "@/lib/client.error";

export function Providers({ children }: PropsWithChildren) {
  const appToast = useAppToast();
  const router = useRouter();
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      mutationCache: new MutationCache({
        onError(error, _variables, _context, mutation) {
          if (handleUnauthorizedError(error)) {
            return;
          }
          if (mutation.meta?.["inlineError"] === true) {
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

      if (clearClientSession(client)) {
        router.replace("/");
      }

      return true;
    }

    return client;
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="bottom-right" richColors theme="system" />
    </QueryClientProvider>
  );
}
