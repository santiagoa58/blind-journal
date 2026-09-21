import StarterKit from "@tiptap/starter-kit";

export const journalEditorExtensions = [
  StarterKit.configure({
    codeBlock: false,
    heading: { levels: [2, 3] },
    horizontalRule: false,
    link: false,
  }),
];
