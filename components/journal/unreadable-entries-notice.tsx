"use client";

import { DownloadIcon, ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Box, Button, Callout } from "@radix-ui/themes";
import { useTranslations } from "next-intl";
import type { UnreadableJournalEntry } from "@/api/journal/journal.type";

type UnreadableEntriesNoticeProps = {
  entries: readonly UnreadableJournalEntry[];
};

export function UnreadableEntriesNotice({ entries }: UnreadableEntriesNoticeProps) {
  const t = useTranslations("journal.unreadableEntries");

  if (entries.length === 0) {
    return null;
  }

  function exportEntries() {
    const data = JSON.stringify(entries, null, 2);
    const url = URL.createObjectURL(new Blob([data], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = t("fileName");
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <Box px="4" pt="3">
      <Callout.Root color="orange" role="alert">
        <Callout.Icon>
          <ExclamationTriangleIcon aria-hidden />
        </Callout.Icon>
        <Callout.Text>{t("message", { count: entries.length })}</Callout.Text>
        <Button color="orange" variant="soft" onClick={exportEntries}>
          <DownloadIcon aria-hidden />
          {t("export")}
        </Button>
      </Callout.Root>
    </Box>
  );
}
