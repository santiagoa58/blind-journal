import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BrandMark } from "./brand-mark";

describe("BrandMark.Icon", () => {
  it.each([
    [16, 3],
    [20, 3],
    [28, 4],
    [32, 4],
  ])("renders a legible %ipx icon with %i slats", (size, slatCount) => {
    const html = renderToStaticMarkup(<BrandMark.Icon size={size} />);
    const pagePath = html.match(/fill="var\(--iris-9\)"[^>]*d="([^"]+)"/)?.[1];

    expect(html).toContain(`width="${size}" height="${size}"`);
    expect(html).toContain('fill="var(--gray-12)"');
    expect(html).toContain('aria-hidden="true"');
    expect(pagePath?.match(/M160 /g)).toHaveLength(slatCount + 1);
  });
});
