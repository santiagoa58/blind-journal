import { API_BASE_URL } from "@/lib/constants/api.constants";
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);

let startPromise: Promise<void> | undefined;

export function startMockWorker(): Promise<void> {
  startPromise ??= worker
    .start({
      serviceWorker: {
        url: "/mockServiceWorker.js",
      },
      onUnhandledRequest(request, print) {
        const { pathname } = new URL(request.url);

        if (pathname.startsWith(`${API_BASE_URL}/`)) {
          print.error();
        }
      },
    })
    .then(() => undefined);

  return startPromise;
}
