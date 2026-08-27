import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireAuthenticatedRoute } from "@/server/auth/route-access";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/i18n/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/server/auth/current-user", () => ({ getCurrentUser: mocks.getCurrentUser }));

const USER = { id: "user-one", username: "writer", displayName: "Writer" };
const REDIRECT_ERROR = new Error("NEXT_REDIRECT");

beforeEach(() => {
  mocks.redirect.mockImplementation(() => {
    throw REDIRECT_ERROR;
  });
});

describe("route access", () => {
  it("returns the current user for an authenticated route", async () => {
    mocks.getCurrentUser.mockResolvedValueOnce(USER);

    await expect(requireAuthenticatedRoute("en")).resolves.toBe(USER);
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("redirects a signed-out request away from an authenticated route", async () => {
    mocks.getCurrentUser.mockResolvedValueOnce(null);

    await expect(requireAuthenticatedRoute("es")).rejects.toBe(REDIRECT_ERROR);
    expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith({ href: "/", locale: "es" });
  });
});
