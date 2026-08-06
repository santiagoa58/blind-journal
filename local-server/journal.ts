import { AUTH_ERROR_CODES } from "@/api/auth/auth.error";
import { JOURNAL_ERROR_CODES } from "@/api/journal/journal.error";
import { createEntryRequestSchema, updateEntryRequestSchema } from "@/api/journal/journal.schema";
import type {
  DeleteJournalEntryResponse,
  JournalEntriesResponse,
  JournalEntry,
  JournalEntryResponse,
  UpdateJournalEntryRequest,
} from "@/api/journal/journal.type";
import { localServerStore } from "@/local-server/store";

function getActiveEntries(): JournalEntry[] | null {
  const activeUserId = localServerStore.activeUserId;

  if (!activeUserId) {
    return null;
  }

  return localServerStore.entriesByUserId[activeUserId] ?? null;
}

function unauthorizedResponse(): Response {
  return Response.json(
    {
      success: false,
      error: { code: AUTH_ERROR_CODES.unauthorized },
    } satisfies JournalEntriesResponse,
    { status: 401 },
  );
}

function invalidEntryResponse(): Response {
  return Response.json(
    {
      success: false,
      error: { code: JOURNAL_ERROR_CODES.invalidEntry },
    } satisfies JournalEntryResponse,
    { status: 400 },
  );
}

function entryNotFoundResponse(): Response {
  return Response.json(
    {
      success: false,
      error: { code: JOURNAL_ERROR_CODES.entryNotFound },
    } satisfies JournalEntryResponse,
    { status: 404 },
  );
}

export function handleJournalEntriesRequest(): Response {
  const entries = getActiveEntries();

  if (!entries) {
    return unauthorizedResponse();
  }

  const response = {
    success: true,
    data: [...entries].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
  } satisfies JournalEntriesResponse;

  return Response.json(response);
}

export async function handleCreateJournalEntryRequest(request: Request): Promise<Response> {
  const entries = getActiveEntries();

  if (!entries) {
    return unauthorizedResponse();
  }

  const body: unknown = await request.json().catch(() => null);
  const result = createEntryRequestSchema.safeParse(body);

  if (!result.success) {
    return invalidEntryResponse();
  }

  const now = new Date().toISOString();
  const entry: JournalEntry = {
    id: crypto.randomUUID(),
    title: result.data.title,
    content: result.data.content,
    createdAt: now,
    updatedAt: now,
    favorite: false,
    tags: [],
  };

  entries.unshift(entry);

  const response = {
    success: true,
    data: entry,
  } satisfies JournalEntryResponse;
  return Response.json(response, { status: 201 });
}

export async function handleUpdateJournalEntryRequest(
  request: Request,
  entryId: string,
): Promise<Response> {
  const entries = getActiveEntries();

  if (!entries) {
    return unauthorizedResponse();
  }

  const body: unknown = await request.json().catch(() => null);
  const result = updateEntryRequestSchema.safeParse(body);

  if (!result.success) {
    return invalidEntryResponse();
  }

  const entryIndex = entries.findIndex(({ id }) => id === entryId);
  const currentEntry = entries[entryIndex];

  if (entryIndex < 0 || !currentEntry) {
    return entryNotFoundResponse();
  }

  const updates: UpdateJournalEntryRequest = {};

  if (result.data.title !== undefined) {
    updates.title = result.data.title;
  }

  if (result.data.content !== undefined) {
    updates.content = result.data.content;
  }

  if (result.data.favorite !== undefined) {
    updates.favorite = result.data.favorite;
  }

  if (result.data.tags !== undefined) {
    updates.tags = result.data.tags;
  }

  const updatedEntry: JournalEntry = {
    ...currentEntry,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  entries[entryIndex] = updatedEntry;

  const response = {
    success: true,
    data: updatedEntry,
  } satisfies JournalEntryResponse;
  return Response.json(response);
}

export function handleDeleteJournalEntryRequest(entryId: string): Response {
  const entries = getActiveEntries();

  if (!entries) {
    return unauthorizedResponse();
  }

  const entryIndex = entries.findIndex(({ id }) => id === entryId);

  if (entryIndex < 0) {
    return entryNotFoundResponse();
  }

  entries.splice(entryIndex, 1);

  const response = {
    success: true,
    data: { id: entryId },
  } satisfies DeleteJournalEntryResponse;

  return Response.json(response);
}
