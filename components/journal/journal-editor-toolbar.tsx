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
import { Button, DropdownMenu, Flex, IconButton, Separator, Tooltip } from "@radix-ui/themes";
import { type Editor, useEditorState } from "@tiptap/react";
import { useTranslations } from "next-intl";
import { Toolbar } from "radix-ui";
import type { PointerEvent, ReactNode } from "react";
import { NumberedListIcon } from "../numbered-list-icon";

type JournalEditorToolbarProps = {
  disabled: boolean;
  editor: Editor | null;
};

type ToolbarControlProps = {
  active?: boolean;
  children: ReactNode;
  disabled: boolean;
  label: string;
  onClick: () => void;
  value?: string;
};

function preserveEditorSelection(event: PointerEvent<HTMLButtonElement>) {
  event.preventDefault();
}

function ToolbarControl({
  active,
  children,
  disabled,
  label,
  onClick,
  value,
}: ToolbarControlProps) {
  const button = (
    <IconButton
      size="2"
      variant={active ? "soft" : "ghost"}
      color={active ? "iris" : "gray"}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      onPointerDown={preserveEditorSelection}
    >
      {children}
    </IconButton>
  );

  return (
    <Tooltip content={label}>
      {value ? (
        <Toolbar.ToggleItem asChild value={value}>
          {button}
        </Toolbar.ToggleItem>
      ) : (
        <Toolbar.Button asChild>{button}</Toolbar.Button>
      )}
    </Tooltip>
  );
}

const headingLevels = [1, 2, 3] as const;

function BlockStyleLabel(props: {
  activeState: { heading1?: boolean; heading2?: boolean; heading3?: boolean };
}) {
  const t = useTranslations("journal-editor.formatting");
  for (const level of headingLevels) {
    if (props.activeState[`heading${level}`]) {
      return (
        <>
          <HeadingIcon aria-hidden width={16} height={16} />
          {t(`heading${level}`)}
        </>
      );
    }
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
  const activeMarks = (["bold", "italic", "underline", "strike", "code"] as const).filter(
    (mark) => activeState[mark],
  );
  const controlsDisabled = disabled || !editor;

  return (
    <Flex asChild align="center" gap="2" width="max-content" minWidth="100%" px="3" py="2">
      <Toolbar.Root aria-label={t("toolbarLabel")}>
        <DropdownMenu.Root>
          <Toolbar.Button asChild>
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
          </Toolbar.Button>
          <DropdownMenu.Content
            align="start"
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              editor?.commands.focus();
            }}
          >
            <DropdownMenu.Item
              disabled={controlsDisabled}
              onSelect={() => editor?.chain().focus().setParagraph().run()}
            >
              {t("paragraph")}
            </DropdownMenu.Item>
            {headingLevels.map((level) => (
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

        <Toolbar.Separator asChild>
          <Separator orientation="vertical" size="1" />
        </Toolbar.Separator>

        <Flex asChild align="center" gap="1" flexShrink="0">
          <Toolbar.ToggleGroup type="multiple" value={activeMarks} aria-label={t("toolbarLabel")}>
            <ToolbarControl
              value="bold"
              label={t("bold")}
              active={activeState.bold}
              disabled={controlsDisabled}
              onClick={() => editor?.chain().focus().toggleBold().run()}
            >
              <FontBoldIcon aria-hidden width={17} height={17} />
            </ToolbarControl>
            <ToolbarControl
              value="italic"
              label={t("italic")}
              active={activeState.italic}
              disabled={controlsDisabled}
              onClick={() => editor?.chain().focus().toggleItalic().run()}
            >
              <FontItalicIcon aria-hidden width={17} height={17} />
            </ToolbarControl>
            <ToolbarControl
              value="underline"
              label={t("underline")}
              active={activeState.underline}
              disabled={controlsDisabled}
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
            >
              <UnderlineIcon aria-hidden width={17} height={17} />
            </ToolbarControl>
            <ToolbarControl
              value="strike"
              label={t("strike")}
              active={activeState.strike}
              disabled={controlsDisabled}
              onClick={() => editor?.chain().focus().toggleStrike().run()}
            >
              <StrikethroughIcon aria-hidden width={17} height={17} />
            </ToolbarControl>
            <ToolbarControl
              value="code"
              label={t("code")}
              active={activeState.code}
              disabled={controlsDisabled}
              onClick={() => editor?.chain().focus().toggleCode().run()}
            >
              <CodeIcon aria-hidden width={17} height={17} />
            </ToolbarControl>
          </Toolbar.ToggleGroup>
        </Flex>

        <Toolbar.Separator asChild>
          <Separator orientation="vertical" size="1" />
        </Toolbar.Separator>

        <Flex align="center" gap="1" flexShrink="0">
          <ToolbarControl
            label={t("bulletedList")}
            active={activeState.bulletList}
            disabled={controlsDisabled}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <ListBulletIcon aria-hidden width={17} height={17} />
          </ToolbarControl>
          <ToolbarControl
            label={t("numberedList")}
            active={activeState.orderedList}
            disabled={controlsDisabled}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <NumberedListIcon aria-hidden width={17} height={17} />
          </ToolbarControl>
          <ToolbarControl
            label={t("quote")}
            active={activeState.blockquote}
            disabled={controlsDisabled}
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          >
            <QuoteIcon aria-hidden width={17} height={17} />
          </ToolbarControl>
        </Flex>

        <Toolbar.Separator asChild>
          <Separator orientation="vertical" size="1" />
        </Toolbar.Separator>

        <Flex align="center" gap="1" flexShrink="0">
          <ToolbarControl
            label={t("undo")}
            disabled={disabled || !activeState.canUndo}
            onClick={() => editor?.chain().focus().undo().run()}
          >
            <CounterClockwiseClockIcon aria-hidden width={17} height={17} />
          </ToolbarControl>
          <ToolbarControl
            label={t("redo")}
            disabled={disabled || !activeState.canRedo}
            onClick={() => editor?.chain().focus().redo().run()}
          >
            <UpdateIcon aria-hidden width={17} height={17} />
          </ToolbarControl>
        </Flex>
      </Toolbar.Root>
    </Flex>
  );
}
