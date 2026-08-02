import { setupWorker } from "msw/browser";
import { API_BASE_URL } from "@/api/constants";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);

export const mockWorkerReady = worker
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
