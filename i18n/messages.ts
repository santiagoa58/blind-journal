import type { Locale } from "@/i18n/routing";
import enAuth from "@/messages/en/auth.json";
import enBrand from "@/messages/en/brand.json";
import enCommon from "@/messages/en/common.json";
import enEntryList from "@/messages/en/entry-list.json";
import enJournal from "@/messages/en/journal.json";
import enJournalEditor from "@/messages/en/journal-editor.json";
import enMetadata from "@/messages/en/metadata.json";
import enSidebar from "@/messages/en/sidebar.json";
import esAuth from "@/messages/es/auth.json";
import esBrand from "@/messages/es/brand.json";
import esCommon from "@/messages/es/common.json";
import esEntryList from "@/messages/es/entry-list.json";
import esJournal from "@/messages/es/journal.json";
import esJournalEditor from "@/messages/es/journal-editor.json";
import esMetadata from "@/messages/es/metadata.json";
import esSidebar from "@/messages/es/sidebar.json";

export const englishMessages = {
  auth: enAuth,
  brand: enBrand,
  common: enCommon,
  "entry-list": enEntryList,
  journal: enJournal,
  "journal-editor": enJournalEditor,
  metadata: enMetadata,
  sidebar: enSidebar,
};

export type AppMessages = typeof englishMessages;

const spanishMessages = {
  auth: esAuth,
  brand: esBrand,
  common: esCommon,
  "entry-list": esEntryList,
  journal: esJournal,
  "journal-editor": esJournalEditor,
  metadata: esMetadata,
  sidebar: esSidebar,
} satisfies AppMessages;

const messagesByLocale = {
  en: englishMessages,
  es: spanishMessages,
} satisfies Record<Locale, AppMessages>;

export function getMessages(locale: Locale): AppMessages {
  return messagesByLocale[locale];
}
