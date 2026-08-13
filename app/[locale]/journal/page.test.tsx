import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import JournalPage from "@/app/[locale]/journal/page";

vi.mock("@/components/journal/journal-workspace", () => ({
  JournalWorkspace: () => <div data-journal-workspace />,
}));

describe("journal page landmarks", () => {
  it("owns one main landmark around the complete workspace", () => {
    const markup = renderToStaticMarkup(<JournalPage />);

    expect(markup).toBe('<main><div data-journal-workspace="true"></div></main>');
  });
});
