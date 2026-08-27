import "server-only";

import { getServerEnvironment } from "@/server/environment";

type ServerErrorContext = {
  error: unknown;
  method: string;
  requestId?: string | undefined;
  route: string;
  routeType: string;
};

function errorName(error: unknown): string {
  if (!(error instanceof Error)) {
    return "NonErrorThrown";
  }
  return /^[A-Za-z][A-Za-z0-9]*Error$/.test(error.name) ? error.name : "Error";
}

export function reportServerError({
  error,
  method,
  requestId,
  route,
  routeType,
}: ServerErrorContext): void {
  const event: Record<string, string | undefined> = {
    level: "error",
    event: "server.request.failed",
    method,
    route,
    routeType,
    errorName: errorName(error),
  };
  if (requestId != null) {
    event["requestId"] = requestId;
  }
  if (getServerEnvironment().nodeEnvironment === "development" && error instanceof Error) {
    event["errorMessage"] = error.message;
    event["errorStack"] = error.stack;
  }

  // biome-ignore lint/suspicious/noConsole: Structured server diagnostics are the logging output.
  console.error(JSON.stringify(event));
}
