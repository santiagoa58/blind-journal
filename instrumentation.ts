import type { Instrumentation } from "next";
import { REQUEST_ID_HEADER } from "@/api/observability";

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
