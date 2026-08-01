import { API_BASE_URL } from "@/lib/constants/api.constants";

let transportReady: Promise<void> = Promise.resolve();

export function setApiTransportReady(ready: Promise<void>): void {
  transportReady = ready;
}

export async function apiFetch(
  path: `/${string}`,
  init?: RequestInit,
): Promise<Response> {
  await transportReady;

  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
  });
}
