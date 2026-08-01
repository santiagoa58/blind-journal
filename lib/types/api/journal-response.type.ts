import { JournalEntry } from "../journal.type";
import { ApiResponse } from "./response.type";

export type JournalEntriesResponse = ApiResponse<JournalEntry[]>;
