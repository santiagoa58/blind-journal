import { setApiTransportReady } from "@/lib/api/client";

if (process.env.NEXT_PUBLIC_BACKEND_MODE !== "remote") {
  setApiTransportReady(
    import("@/mocks/browser").then(({ startMockWorker }) => startMockWorker()),
  );
}
