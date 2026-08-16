"use client";

import {
  ChevronDownIcon,
  CodeIcon,
  CounterClockwiseClockIcon,
  FontBoldIcon,
  FontItalicIcon,
  HeadingIcon,
  ListBulletIcon,
  QuoteIcon,
  StrikethroughIcon,
  TextIcon,
  UnderlineIcon,
  UpdateIcon,
} from "@radix-ui/react-icons";
import {
  Button,
  type ButtonProps,
  DropdownMenu,
  Flex,
  type FlexProps,
  IconButton,
  Separator,
  Tooltip,
} from "@radix-ui/themes";
import { type Editor, useEditorState } from "@tiptap/react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { NumberedListIcon } from "../numbered-list-icon";

type JournalEditorToolbarProps = {
  disabled: boolean;
  editor: Editor | null;
};

interface ToolbarButtonProps extends ButtonProps {
  active?: boolean;
  children: ReactNode;
  label: string;
}

function ToolbarButton({ children, label, active, ...props }: ToolbarButtonProps) {
  return (
    <Tooltip content={label}>
      <IconButton
        size="2"
        variant={active ? "soft" : "ghost"}
        color={active ? "iris" : "gray"}
        aria-label={label}
        aria-pressed={active}
        {...props}
      >
        {children}
      </IconButton>
    </Tooltip>
  );
}

function ToolbarGroup(props: FlexProps) {
  return <Flex align="center" gap="3" flexShrink="0" {...props} />;
}
function BlockStyleLabel(props: {
  activeState: { heading1?: boolean; heading2?: boolean; heading3?: boolean };
}) {
  const t = useTranslations("journal-editor.formatting");
  if (props.activeState.heading1) {
    return (
      <>
        <HeadingIcon aria-hidden width={16} height={16} />
        {t("heading1")}
      </>
    );
  }
  if (props.activeState.heading2) {
    return (
      <>
        <HeadingIcon aria-hidden width={16} height={16} />
        {t("heading2")}
      </>
    );
  }
  if (props.activeState.heading3) {
    return (
      <>
        <HeadingIcon aria-hidden width={16} height={16} />
        {t("heading3")}
      </>
    );
  }
  return (
    <>
      <TextIcon aria-hidden width={16} height={16} />
      {t("paragraph")}
    </>
  );
}

export function JournalEditorToolbar({ disabled, editor }: JournalEditorToolbarProps) {
  const t = useTranslations("journal-editor.formatting");
  const state = useEditorState({
    editor,
    selector: ({ editor: activeEditor }) => ({
      blockquote: activeEditor?.isActive("blockquote") ?? false,
      bold: activeEditor?.isActive("bold") ?? false,
      bulletList: activeEditor?.isActive("bulletList") ?? false,
      canRedo: activeEditor?.can().redo() ?? false,
      canUndo: activeEditor?.can().undo() ?? false,
      code: activeEditor?.isActive("code") ?? false,
      heading1: activeEditor?.isActive("heading", { level: 1 }) ?? false,
      heading2: activeEditor?.isActive("heading", { level: 2 }) ?? false,
      heading3: activeEditor?.isActive("heading", { level: 3 }) ?? false,
      italic: activeEditor?.isActive("italic") ?? false,
      orderedList: activeEditor?.isActive("orderedList") ?? false,
      strike: activeEditor?.isActive("strike") ?? false,
      underline: activeEditor?.isActive("underline") ?? false,
    }),
  });
  const activeState = state ?? {
    blockquote: false,
    bold: false,
    bulletList: false,
    canRedo: false,
    canUndo: false,
    code: false,
    heading1: false,
    heading2: false,
    heading3: false,
    italic: false,
    orderedList: false,
    strike: false,
    underline: false,
  };
  const controlsDisabled = disabled || !editor;

  return (
    <Flex
      align="center"
      gap="2"
      width="max-content"
      minWidth="100%"
      minHeight="var(--space-8)"
      px="3"
      py="2"
      role="group"
      aria-label={t("toolbarLabel")}
    >
      <ToolbarGroup>
        <ToolbarButton
          label={t("undo")}
          disabled={disabled || !activeState.canUndo}
          onClick={() => editor?.chain().focus().undo().run()}
        >
          <CounterClockwiseClockIcon aria-hidden width={17} height={17} />
        </ToolbarButton>
        <ToolbarButton
          label={t("redo")}
          disabled={disabled || !activeState.canRedo}
          onClick={() => editor?.chain().focus().redo().run()}
        >
          <UpdateIcon aria-hidden width={17} height={17} />
        </ToolbarButton>
      </ToolbarGroup>

      <Separator orientation="vertical" size="1" />

      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <Button
            size="2"
            variant="ghost"
            color="gray"
            aria-label={t("textStyle")}
            disabled={controlsDisabled}
          >
            <BlockStyleLabel activeState={activeState} />
            <ChevronDownIcon aria-hidden width={14} height={14} />
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="start">
          <DropdownMenu.Item
            disabled={controlsDisabled}
            onSelect={() => editor?.chain().focus().setParagraph().run()}
          >
            {t("paragraph")}
          </DropdownMenu.Item>
          {([1, 2, 3] as const).map((level) => (
            <DropdownMenu.Item
              key={level}
              disabled={controlsDisabled}
              onSelect={() => editor?.chain().focus().toggleHeading({ level }).run()}
            >
              {t(`heading${level}`)}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Root>

      <Separator orientation="vertical" size="1" />

      <ToolbarGroup>
        <ToolbarButton
          label={t("bold")}
          active={activeState.bold}
          disabled={controlsDisabled}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <FontBoldIcon aria-hidden width={17} height={17} />
        </ToolbarButton>
        <ToolbarButton
          label={t("italic")}
          active={activeState.italic}
          disabled={controlsDisabled}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <FontItalicIcon aria-hidden width={17} height={17} />
        </ToolbarButton>
        <ToolbarButton
          label={t("underline")}
          active={activeState.underline}
          disabled={controlsDisabled}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon aria-hidden width={17} height={17} />
        </ToolbarButton>
        <ToolbarButton
          label={t("strike")}
          active={activeState.strike}
          disabled={controlsDisabled}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
        >
          <StrikethroughIcon aria-hidden width={17} height={17} />
        </ToolbarButton>
        <ToolbarButton
          label={t("code")}
          active={activeState.code}
          disabled={controlsDisabled}
          onClick={() => editor?.chain().focus().toggleCode().run()}
        >
          <CodeIcon aria-hidden width={17} height={17} />
        </ToolbarButton>
      </ToolbarGroup>

      <Separator orientation="vertical" size="1" />

      <ToolbarGroup>
        <ToolbarButton
          label={t("bulletedList")}
          active={activeState.bulletList}
          disabled={controlsDisabled}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <ListBulletIcon aria-hidden width={17} height={17} />
        </ToolbarButton>
        <ToolbarButton
          label={t("numberedList")}
          active={activeState.orderedList}
          disabled={controlsDisabled}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <NumberedListIcon aria-hidden width={17} height={17} />
        </ToolbarButton>
        <ToolbarButton
          label={t("quote")}
          active={activeState.blockquote}
          disabled={controlsDisabled}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        >
          <QuoteIcon aria-hidden width={17} height={17} />
        </ToolbarButton>
      </ToolbarGroup>
    </Flex>
  );
}
