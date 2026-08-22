import { CheckCircledIcon, Pencil2Icon } from "@radix-ui/react-icons";
import { Badge, Flex, Separator, Spinner, Text, TextField } from "@radix-ui/themes";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { useId } from "react";
import { MAX_JOURNAL_ENTRY_TITLE_CHARACTERS } from "@/api/journal/journal.constants";
import type { JournalEntry } from "@/api/journal/journal.type";

type JournalEditorDocumentHeaderProps = {
  draftDirty: boolean;
  entry: JournalEntry | undefined;
  onTitleBlur: () => void;
  onTitleChange: (title: string) => void;
  onTitleSubmit: () => void;
  saving: boolean;
  title: string;
  titlePlaceholder: string;
};

type DocumentStatusProps = {
  status: "saving" | "unsaved" | "saved";
};

function DocumentStatus({ status }: DocumentStatusProps) {
  const t = useTranslations("journal-editor");

  const documentSaveStatus = (
    {
      saving: {
        color: "iris",
        icon: <Spinner size="1" aria-hidden />,
        text: t("documentStatus.saving"),
      },
      unsaved: {
        color: "orange",
        icon: <Pencil2Icon aria-hidden />,
        text: t("documentStatus.unsaved"),
      },
      saved: {
        color: "green",
        icon: <CheckCircledIcon aria-hidden />,
        text: t("documentStatus.saved"),
      },
    } as const
  )[status];

  return (
    <Badge role="status" size="1" variant="soft" color={documentSaveStatus.color} radius="full">
      {documentSaveStatus.icon}
      {documentSaveStatus.text}
    </Badge>
  );
}

export function JournalEditorDocumentHeader({
  draftDirty,
  entry,
  onTitleBlur,
  onTitleChange,
  onTitleSubmit,
  saving,
  title,
  titlePlaceholder,
}: JournalEditorDocumentHeaderProps) {
  const t = useTranslations("journal-editor");
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const titleId = useId();
  const createdAt = entry ? new Date(entry.createdAt) : undefined;
  const updatedAt = entry ? new Date(entry.updatedAt) : undefined;
  const unsaved = entry === undefined || draftDirty;
  return (
    <>
      <Flex
        direction={{ initial: "column", xs: "row" }}
        align={{ initial: "start", xs: "center" }}
        gap="2"
        mb="5"
      >
        <DocumentStatus status={saving ? "saving" : unsaved ? "unsaved" : "saved"} />
        {entry && createdAt && updatedAt ? (
          <Flex align="center" gap="2">
            <Text asChild size="1" color="gray">
              <time dateTime={entry.createdAt}>
                {format.dateTime(createdAt, { dateStyle: "medium" })}
              </time>
            </Text>
            <Separator aria-hidden orientation="vertical" size="1" />
            <Text asChild size="1" color="gray">
              <time dateTime={entry.updatedAt}>
                {t("lastSaved", {
                  time: format.relativeTime(updatedAt, { now }),
                })}
              </time>
            </Text>
          </Flex>
        ) : null}
      </Flex>

      <Text as="label" htmlFor={titleId} size="1" color="gray" weight="medium">
        {t("entryTitleLabel")}
      </Text>
      <TextField.Root
        id={titleId}
        mt="2"
        size="3"
        variant="surface"
        value={title}
        placeholder={titlePlaceholder}
        maxLength={MAX_JOURNAL_ENTRY_TITLE_CHARACTERS}
        disabled={saving}
        onChange={(event) => onTitleChange(event.target.value)}
        onBlur={onTitleBlur}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onTitleSubmit();
          }
        }}
      />
    </>
  );
}
