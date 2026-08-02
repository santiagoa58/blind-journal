import { afterAll, afterEach, beforeAll } from "vitest";
import { mockServer } from "@/tests/mocks/server";

beforeAll(() => {
  mockServer.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  mockServer.resetHandlers();
});

afterAll(() => {
  mockServer.close();
});
