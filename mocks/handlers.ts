import { http } from "msw";
import { API_BASE_URL } from "@/api/constants";
import {
  handleCreateAccountRequest,
  handleLoginRequest,
  handleLogoutRequest,
  handleSessionRequest,
} from "@/local-server/auth";
import {
  handleCreateJournalEntryRequest,
  handleDeleteJournalEntryRequest,
  handleJournalEntriesRequest,
  handleUpdateJournalEntryRequest,
} from "@/local-server/journal";

export const handlers = [
  http.get(`${API_BASE_URL}/entries`, () => handleJournalEntriesRequest()),
  http.post(`${API_BASE_URL}/entries`, ({ request }) => handleCreateJournalEntryRequest(request)),
  http.patch(`${API_BASE_URL}/entries/:entryId`, ({ params, request }) =>
    handleUpdateJournalEntryRequest(request, String(params["entryId"])),
  ),
  http.delete(`${API_BASE_URL}/entries/:entryId`, ({ params }) =>
    handleDeleteJournalEntryRequest(String(params["entryId"])),
  ),
  http.post(`${API_BASE_URL}/auth/login`, ({ request }) => handleLoginRequest(request)),
  http.post(`${API_BASE_URL}/auth/accounts`, ({ request }) => handleCreateAccountRequest(request)),
  http.get(`${API_BASE_URL}/auth/session`, () => handleSessionRequest()),
  http.post(`${API_BASE_URL}/auth/logout`, () => handleLogoutRequest()),
];
