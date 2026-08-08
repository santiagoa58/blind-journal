import "server-only";

import { createJournalService } from "@/server/journal.service";
import { serverApplicationStore } from "@/server/store";

export const { createEntry, deleteEntry, listEntries, updateEntry } =
  createJournalService(serverApplicationStore);
