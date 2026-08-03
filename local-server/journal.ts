import { AUTH_ERROR_CODES } from "@/api/auth/auth.error";
import { JOURNAL_ERROR_CODES } from "@/api/journal/journal.error";
import type {
  CreateJournalEntryRequest,
  DeleteJournalEntryResponse,
  JournalEntriesResponse,
  JournalEntry,
  JournalEntryResponse,
  UpdateJournalEntryRequest,
} from "@/api/journal/journal.type";
import { localServerStore } from "@/local-server/store";
import { z } from "zod";

const createEntryRequestSchema: z.ZodType<CreateJournalEntryRequest> =
  z.strictObject({
    title: z.string().trim().min(1).max(120),
    content: z.string().max(100_000),
  });

const updateEntryRequestSchema = z
  .strictObject({
    title: z.string().trim().min(1).max(120).optional(),
    content: z.string().max(100_000).optional(),
    favorite: z.boolean().optional(),
    mood: z
      .enum(["calm", "hopeful", "reflective", "tired", "grateful"])
      .optional(),
    tags: z.array(z.string().trim().min(1).max(32)).max(12).optional(),
  })
  .refine((input) => Object.keys(input).length > 0);

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

function toPlainText(content: string): string {
  return content
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function getContentSummary(content: string) {
  const plainText = toPlainText(content);

  return {
    preview: plainText.slice(0, 140),
  };
}

export function handleJournalEntriesRequest(): Response {
  const entries = getActiveEntries();

  if (!entries) {
    return unauthorizedResponse();
  }

  const response = {
    success: true,
    data: [...entries].sort((left, right) =>
      right.updatedAt.localeCompare(left.updatedAt),
    ),
  } satisfies JournalEntriesResponse;

  return Response.json(response);
}

export async function handleCreateJournalEntryRequest(
  request: Request,
): Promise<Response> {
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
  const summary = getContentSummary(result.data.content);
  const entry: JournalEntry = {
    id: crypto.randomUUID(),
    title: result.data.title,
    content: result.data.content,
    createdAt: now,
    updatedAt: now,
    favorite: false,
    mood: "reflective",
    tags: [],
    ...summary,
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

  if (result.data.mood !== undefined) {
    updates.mood = result.data.mood;
  }

  if (result.data.tags !== undefined) {
    updates.tags = result.data.tags;
  }

  const content = updates.content ?? currentEntry.content;
  const updatedEntry: JournalEntry = {
    ...currentEntry,
    ...updates,
    ...getContentSummary(content),
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
