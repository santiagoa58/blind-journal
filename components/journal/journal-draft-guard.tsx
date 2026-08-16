"use client";

import { AlertDialog, Button, Flex } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

type JournalDraftGuardProps = {
  dirty: boolean;
  open: boolean;
  onCancel: () => void;
  onDiscard: () => void;
};

export function JournalDraftGuard({ dirty, open, onCancel, onDiscard }: JournalDraftGuardProps) {
  const t = useTranslations("journal-editor.unsavedDialog");
  const tCommon = useTranslations("common.actions");

  useEffect(() => {
    if (!dirty) {
      return;
    }

    function preventUnsavedDraftLoss(event: BeforeUnloadEvent) {
      event.preventDefault();
      // only used for legacy browsers
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", preventUnsavedDraftLoss);
    return () => window.removeEventListener("beforeunload", preventUnsavedDraftLoss);
  }, [dirty]);

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onCancel();
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
            <Button color="red" onClick={onDiscard}>
              {t("discard")}
            </Button>
          </AlertDialog.Action>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
