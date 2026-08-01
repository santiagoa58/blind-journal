import { API_BASE_URL } from "@/lib/constants/api.constants";
import { JournalEntriesResponse } from "@/lib/types/api/journal-response.type";
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

const getUser = (username: string) => {
  return users.find((user) => user.username === username);
};
const generateSalt = () => crypto.getRandomValues(new Uint8Array(16)).join("");

export const handlers = [
  http.get(`${API_BASE_URL}/entries`, (_args) => {
    return HttpResponse.json(mockGetJournalEntriesResponse);
  }),
  http.post(`${API_BASE_URL}/auth/login`, async (args) => {
    const body = await args.request.json();
    if (typeof body != "object" || body == null || !("username" in body)) {
      console.error("Invalid request body:", body);
      return HttpResponse.json(mockUserNotFoundResponse);
    }
    const user = getUser(body?.username);
    if (!user) {
      console.error("User not found:", body, body?.username);
      return HttpResponse.json(mockUserNotFoundResponse);
    }

    return HttpResponse.json({
      data: {
        ...user,
        salt: generateSalt(),
      },
      status: 200,
    });
  }),
];
