import { describe, expect, it, vi } from "vitest";
import { isCodedError, reportClientError } from "@/client.error";

describe("client error handling", () => {
  it("recognizes only errors with string codes", () => {
    expect(isCodedError(Object.assign(new Error("coded"), { code: "TEST_ERROR" }))).toBe(true);
    expect(isCodedError(new Error("uncoded"))).toBe(false);
    expect(isCodedError({ code: "TEST_ERROR" })).toBe(false);
    expect(isCodedError({ code: 500 })).toBe(false);
    expect(isCodedError(null)).toBe(false);
  });

  it("reports the original error through the platform error channel", () => {
    const platformReportError = vi.fn();
    vi.stubGlobal("reportError", platformReportError);
    const error = Object.assign(new Error("unmapped"), { code: "UNKNOWN_ERROR" });

    reportClientError(error);

    expect(platformReportError).toHaveBeenCalledExactlyOnceWith(error);
  });
});
