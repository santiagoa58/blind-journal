"use client";

import { Theme } from "@radix-ui/themes";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { type PropsWithChildren, useState } from "react";
import { Toaster } from "sonner";
import { AUTH_ERROR_CODES } from "@/api/auth/auth.error";
import { isCodedError } from "@/client.error";
import { useAppToast } from "@/hooks/use-app-toast";
import { clearClientSession } from "@/hooks/use-client-session";
import { useRouter } from "@/i18n/navigation";

type ProvidersProps = PropsWithChildren<{ nonce?: string | undefined }>;

export function Providers({ children, nonce }: ProvidersProps) {
  const appToast = useAppToast();
  const router = useRouter();
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      mutationCache: new MutationCache({
        onError(error) {
          if (isCodedError(error) && error.code === AUTH_ERROR_CODES.unauthorized) {
            clearClientSession(client);
            router.replace("/");
          }
          appToast.error(error);
        },
      }),
      queryCache: new QueryCache({
        onError(error, query) {
          const unauthorized = isCodedError(error) && error.code === AUTH_ERROR_CODES.unauthorized;
          if (unauthorized) {
            clearClientSession(client);
            router.replace("/");
          }
          if (unauthorized || query.state.data !== undefined) {
            appToast.error(error);
          }
        },
      }),
    });

    return client;
  });

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
