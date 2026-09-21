import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import manifest from "./manifest";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}));

describe("web manifest icons", () => {
  it("keeps SVG masters and correctly sized PNG fallbacks for both purposes", async () => {
    const icons = (await manifest()).icons;

    expect(icons).toEqual([
      { src: "/brand/blind-journal-mark.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      {
        src: "/brand/blind-journal-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/maskable-icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/maskable-icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ]);

    for (const icon of icons ?? []) {
      const asset = await readFile(join(process.cwd(), "public", icon.src.replace(/^\//, "")));
      if (icon.type === "image/png") {
        const size = Number(icon.sizes?.split("x")[0]);
        expect(asset.subarray(0, 8)).toEqual(Buffer.from("89504e470d0a1a0a", "hex"));
        expect(asset.readUInt32BE(16)).toBe(size);
        expect(asset.readUInt32BE(20)).toBe(size);
      }
    }
  });
});
