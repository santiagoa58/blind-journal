import { API_BASE_URL } from "@/lib/constants/api.constants";
import type { JournalEntriesResponse } from "@/lib/types/api/journal-response.type";
import type { ApiSuccessResponse } from "@/lib/types/api/response.type";
import type { User } from "@/lib/types/user.type";
import { http, HttpResponse } from "msw";
import { journalEntries } from "./journal-entries.mock";
import { users } from "./users.mock";

const mockGetJournalEntriesResponse: JournalEntriesResponse = {
  data: journalEntries,
  status: 200,
};

const mockUserNotFoundResponse = {
  error: "User not found",
  status: 404,
};

const mockInvalidRequestResponse = {
  error: "A username is required",
  status: 400,
};

const getUser = (username: string) => {
  return users.find((user) => user.username === username);
};

export const handlers = [
  http.get(`${API_BASE_URL}/entries`, () => {
    return HttpResponse.json(mockGetJournalEntriesResponse, { status: 200 });
  }),
  http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
    const body: unknown = await request.json().catch(() => null);

    if (
      typeof body !== "object" ||
      body === null ||
      !("username" in body) ||
      typeof body.username !== "string" ||
      body.username.trim() === ""
    ) {
      return HttpResponse.json(mockInvalidRequestResponse, { status: 400 });
    }

    const user = getUser(body.username.trim());

    if (!user) {
      return HttpResponse.json(mockUserNotFoundResponse, { status: 404 });
    }

    const response = {
      data: {
        ...user,
      },
      status: 200,
    } satisfies ApiSuccessResponse<User>;

    return HttpResponse.json(response, { status: 200 });
  }),
];
