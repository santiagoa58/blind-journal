import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import JournalPage from "@/app/[locale]/journal/page";

const mocks = vi.hoisted(() => ({ requireAuthenticatedRoute: vi.fn() }));

vi.mock("next-intl/server", () => ({ setRequestLocale: vi.fn() }));
vi.mock("@/components/journal/journal-workspace", () => ({
  JournalWorkspace: () => <div data-journal-workspace />,
}));
vi.mock("@/server/auth/route-access", () => ({
  requireAuthenticatedRoute: mocks.requireAuthenticatedRoute,
}));

describe("journal page landmarks", () => {
  it("requires route authentication before rendering one main landmark", async () => {
    const page = await JournalPage({ params: Promise.resolve({ locale: "en" }) });
    const markup = renderToStaticMarkup(page);

    expect(mocks.requireAuthenticatedRoute).toHaveBeenCalledExactlyOnceWith("en");
    expect(markup).toBe('<main><div data-journal-workspace="true"></div></main>');
  });
});
