// @vitest-environment jsdom

import { Editor } from "@tiptap/core";
import { afterEach, describe, expect, it } from "vitest";
import { journalEditorExtensions } from "@/components/journal/journal-editor.config";

const allowedNodes = [
  "blockquote",
  "bulletList",
  "doc",
  "hardBreak",
  "heading",
  "listItem",
  "orderedList",
  "paragraph",
  "text",
];
const allowedMarks = ["bold", "code", "italic", "strike", "underline"];
const maliciousHtml = `
  <h4 id="clobber-target" onclick="globalThis.compromised = true">Unsupported heading</h4>
  <p id="journal" name="journal" style="background-image: url(javascript:alert(1))" onclick="alert(1)">
    Safe text
    <strong onmouseover="alert(1)">allowed bold</strong>
    <a href="javascript:alert(1)">unlinked text</a>
    <img src="x" onerror="alert(1)">
    <svg onload="alert(1)"><script>alert(1)</script></svg>
    <iframe srcdoc="<script>alert(1)</script>"></iframe>
    <script>alert(1)</script>
  </p>
`;

const editors: Editor[] = [];

function createEditor(content = "<p></p>"): Editor {
  const editor = new Editor({
    content,
    extensions: journalEditorExtensions,
  });
  editors.push(editor);
  return editor;
}

function expectSafeCanonicalHtml(html: string): void {
  expect(html).toContain("Safe text");
  expect(html).toContain("<strong>allowed bold</strong>");
  expect(html).toContain("unlinked text");
  expect(html).not.toMatch(
    /<(?:a|iframe|img|script|svg)\b|\b(?:href|id|name|on\w+|srcdoc|style)=|javascript:/i,
  );
}

afterEach(() => {
  for (const editor of editors.splice(0)) {
    editor.destroy();
  }
});

describe("journal rich-text schema", () => {
  it("allows only the nodes, marks, and heading levels exposed by the editor", () => {
    const editor = createEditor("<h3>Allowed heading</h3><h4>Unsupported heading</h4>");

    expect(Object.keys(editor.schema.nodes).toSorted()).toEqual(allowedNodes);
    expect(Object.keys(editor.schema.marks).toSorted()).toEqual(allowedMarks);
    expect(editor.getHTML()).toBe("<h3>Allowed heading</h3><p>Unsupported heading</p>");
  });

  it("normalizes malicious decrypted HTML before rendering it", () => {
    const editor = createEditor(maliciousHtml);

    expectSafeCanonicalHtml(editor.getHTML());
  });

  it("normalizes malicious clipboard HTML through the same schema", () => {
    const editor = createEditor();
    const clipboardData = {
      files: [],
      getData: (type: string) => (type === "text/html" ? maliciousHtml : "Safe text"),
      items: [],
      types: ["text/html", "text/plain"],
    };
    const pasteEvent = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(pasteEvent, "clipboardData", { value: clipboardData });

    editor.view.dom.dispatchEvent(pasteEvent);

    expectSafeCanonicalHtml(editor.getHTML());
  });
});
