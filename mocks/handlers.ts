import { http } from "msw";
import { API_BASE_URL } from "@/api/constants";
import { handleUserSaltRequest } from "@/local-server/auth";
import { handleJournalEntriesRequest } from "@/local-server/journal";

export const handlers = [
  http.get(`${API_BASE_URL}/entries`, () => handleJournalEntriesRequest()),
  http.post(`${API_BASE_URL}/auth/login`, ({ request }) => handleUserSaltRequest(request)),
];
