import "@tanstack/react-query";
import type { CodedError } from "@/client.error";

declare module "@tanstack/react-query" {
  interface Register {
    defaultError: CodedError;
  }
}
