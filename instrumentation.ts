import type { Instrumentation } from "next";
import { REQUEST_ID_HEADER } from "@/api/observability";

// Next.js calls register once for each new server instance and waits for it to finish before that
// instance handles requests. This makes it the earliest reliable place to reject invalid setup.
export async function register(): Promise<void> {
  // Instrumentation can also run in the Edge runtime, where this application's Node-only server
  // configuration (including Buffer-based secret decoding) must not be loaded.
  if (process.env["NEXT_RUNTIME"] === "edge") {
    return;
  }

  // Keep the import inside the Node-runtime branch so the Edge bundle never evaluates the module.
  const { getServerEnvironment } = await import("@/server/environment");

  // Calling the getter validates every server variable and caches the typed result. If validation
  // throws, startup fails now instead of allowing the first real request to discover bad config.
  getServerEnvironment();
}

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const { reportServerError } = await import("@/server/observability");
  const requestIdHeader = request.headers[REQUEST_ID_HEADER];
  const requestId = Array.isArray(requestIdHeader) ? requestIdHeader[0] : requestIdHeader;

  reportServerError({
    error,
    method: request.method,
    requestId,
    route: context.routePath,
    routeType: context.routeType,
  });
};
