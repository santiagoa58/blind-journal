import "@tanstack/react-query";
import type { CodedError } from "@/lib/client.error";

declare module "@tanstack/react-query" {
  interface Register {
    defaultError: CodedError;
  }
}
