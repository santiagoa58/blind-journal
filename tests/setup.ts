import { afterAll, afterEach, beforeAll } from "vitest";
import { resetLocalServerStore } from "@/local-server/store";
import { mockServer } from "@/tests/mocks/server";

beforeAll(() => {
  mockServer.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  mockServer.resetHandlers();
  resetLocalServerStore();
});

afterAll(() => {
  mockServer.close();
});
