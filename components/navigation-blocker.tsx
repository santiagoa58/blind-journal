"use client";

import { AlertDialog, Button, Flex } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import {
  type ComponentProps,
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Link, useRouter } from "@/i18n/navigation";

type NavigationAction = () => void;

type NavigationBlockerContextValue = {
  blocked: boolean;
  run: (action: NavigationAction) => void;
  setBlocked: (blocked: boolean) => void;
};

const NavigationBlockerContext = createContext<NavigationBlockerContextValue | null>(null);

export function NavigationBlockerProvider({ children }: PropsWithChildren) {
  const t = useTranslations("journal-editor.unsavedDialog");
  const tCommon = useTranslations("common.actions");
  const [blocked, setBlocked] = useState(false);
  const [open, setOpen] = useState(false);
  const pendingAction = useRef<NavigationAction | null>(null);

  useEffect(() => {
    if (!blocked) {
      return;
    }

    function preventUnsavedChangesLoss(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", preventUnsavedChangesLoss);
    return () => window.removeEventListener("beforeunload", preventUnsavedChangesLoss);
  }, [blocked]);

  function run(action: NavigationAction) {
    if (!blocked) {
      action();
      return;
    }

    pendingAction.current = action;
    setOpen(true);
  }

  function cancel() {
    pendingAction.current = null;
    setOpen(false);
  }

  function discardAndContinue() {
    const action = pendingAction.current;
    pendingAction.current = null;
    setOpen(false);
    setBlocked(false);
    action?.();
  }

  return (
    <NavigationBlockerContext.Provider value={{ blocked, run, setBlocked }}>
      {children}
      <AlertDialog.Root
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            cancel();
          }
        }}
      >
        <AlertDialog.Content maxWidth="440px">
          <AlertDialog.Title>{t("title")}</AlertDialog.Title>
          <AlertDialog.Description size="2">{t("description")}</AlertDialog.Description>
          <Flex gap="3" mt="5" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">
                {tCommon("cancel")}
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button color="red" onClick={discardAndContinue}>
                {t("discard")}
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </NavigationBlockerContext.Provider>
  );
}

export function useNavigationBlocker() {
  const context = useContext(NavigationBlockerContext);

  if (!context) {
    throw new Error("useNavigationBlocker must be used within NavigationBlockerProvider");
  }

  return context;
}

type GuardedLinkProps = Omit<ComponentProps<typeof Link>, "onNavigate">;

export function GuardedLink({ href, ...props }: GuardedLinkProps) {
  const router = useRouter();
  const { blocked, run } = useNavigationBlocker();

  return (
    <Link
      href={href}
      {...props}
      onNavigate={(event) => {
        if (!blocked) {
          return;
        }

        event.preventDefault();
        run(() => router.push(href));
      }}
    />
  );
}
