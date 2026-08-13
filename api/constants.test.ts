import { describe, expect, it } from "vitest";
import { API_BASE_PATH } from "@/api/constants";

describe("API origin contract", () => {
  it("uses an origin-relative base path", () => {
    expect(API_BASE_PATH).toMatch(/^\/(?!\/)/);
    expect(URL.canParse(API_BASE_PATH)).toBe(false);
  });
});
