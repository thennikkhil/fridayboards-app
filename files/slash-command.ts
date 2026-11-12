// app/(app)/board/[boardId]/_widgets/notes/slash-command.ts
import { Extension, type Editor, type Range } from "@tiptap/core";
import Suggestion, { type SuggestionProps, type SuggestionKeyDownProps } from "@tiptap/suggestion";

export type SlashItem = {
  title: string;
  hint: string;
  keywords: string[];
  run: (editor: Editor, range: Range) => void;
};

// Each item deletes the "/query" text first, then applies the block.
export const SLASH_ITEMS: SlashItem[] = [
  { title: "Text", hint: "Plain paragraph", keywords: ["p", "paragraph"],
    run: (e, r) => e.chain().focus().deleteRange(r).setParagraph().run() },
  { title: "Heading 1", hint: "Big section title", keywords: ["h1", "title"],
    run: (e, r) => e.chain().focus().deleteRange(r).setHeading({ level: 1 }).run() },
  { title: "Heading 2", hint: "Medium heading", keywords: ["h2"],
    run: (e, r) => e.chain().focus().deleteRange(r).setHeading({ level: 2 }).run() },
  { title: "Heading 3", hint: "Small heading", keywords: ["h3"],
    run: (e, r) => e.chain().focus().deleteRange(r).setHeading({ level: 3 }).run() },
  { title: "Bullet list", hint: "Simple list", keywords: ["ul", "bullets"],
    run: (e, r) => e.chain().focus().deleteRange(r).toggleBulletList().run() },
  { title: "Numbered list", hint: "Ordered list", keywords: ["ol", "numbers"],
    run: (e, r) => e.chain().focus().deleteRange(r).toggleOrderedList().run() },
  { title: "To-do list", hint: "Checkboxes", keywords: ["todo", "task", "check"],
    run: (e, r) => e.chain().focus().deleteRange(r).toggleTaskList().run() },
  { title: "Quote", hint: "Pull a line out", keywords: ["blockquote"],
    run: (e, r) => e.chain().focus().deleteRange(r).toggleBlockquote().run() },
  { title: "Code block", hint: "Monospaced snippet", keywords: ["code", "pre"],
    run: (e, r) => e.chain().focus().deleteRange(r).toggleCodeBlock().run() },
  { title: "Divider", hint: "Horizontal line", keywords: ["hr", "line"],
    run: (e, r) => e.chain().focus().deleteRange(r).setHorizontalRule().run() },
];

// The React component registers these callbacks so the menu renders as normal React.
export type SlashBridge = {
  onStart: (p: SuggestionProps<SlashItem>) => void;
  onUpdate: (p: SuggestionProps<SlashItem>) => void;
  onKeyDown: (p: SuggestionKeyDownProps) => boolean;
  onExit: () => void;
};

export const SlashCommand = Extension.create<{ bridge: SlashBridge | null }>({
  name: "slashCommand",
  addOptions() {
    return { bridge: null };
  },
  addProseMirrorPlugins() {
    const bridge = this.options.bridge;
    return [
      Suggestion<SlashItem, SlashItem>({
        editor: this.editor,
        char: "/",
        items: ({ query }) => {
          const q = query.toLowerCase();
          return SLASH_ITEMS.filter(
            (i) => i.title.toLowerCase().includes(q) || i.keywords.some((k) => k.includes(q))
          );
        },
        command: ({ editor, range, props }) => props.run(editor, range),
        render: () => ({
          onStart: (p) => bridge?.onStart(p),
          onUpdate: (p) => bridge?.onUpdate(p),
          onKeyDown: (p) => bridge?.onKeyDown(p) ?? false,
          onExit: () => bridge?.onExit(),
        }),
      }),
    ];
  },
});
