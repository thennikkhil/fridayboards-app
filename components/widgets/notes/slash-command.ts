import { Extension, type Editor, type Range } from "@tiptap/core";
import Suggestion, {
  type SuggestionKeyDownProps,
  type SuggestionProps,
} from "@tiptap/suggestion";

export type SlashItem = {
  title: string;
  hint: string;
  keywords: string[];
  run: (editor: Editor, range: Range) => void;
};

export const SLASH_ITEMS: SlashItem[] = [
  {
    title: "Text",
    hint: "Plain paragraph",
    keywords: ["p", "paragraph"],
    run: (editor, range) => editor.chain().focus().deleteRange(range).setParagraph().run(),
  },
  {
    title: "Heading 1",
    hint: "Big section title",
    keywords: ["h1", "title"],
    run: (editor, range) => editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run(),
  },
  {
    title: "Heading 2",
    hint: "Medium heading",
    keywords: ["h2"],
    run: (editor, range) => editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run(),
  },
  {
    title: "Heading 3",
    hint: "Small heading",
    keywords: ["h3"],
    run: (editor, range) => editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run(),
  },
  {
    title: "Bullet list",
    hint: "Simple list",
    keywords: ["ul", "bullets"],
    run: (editor, range) => editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: "Numbered list",
    hint: "Ordered list",
    keywords: ["ol", "numbers"],
    run: (editor, range) => editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    title: "To-do list",
    hint: "Checkboxes",
    keywords: ["todo", "task", "check"],
    run: (editor, range) => editor.chain().focus().deleteRange(range).toggleTaskList().run(),
  },
  {
    title: "Quote",
    hint: "Pull a line out",
    keywords: ["blockquote"],
    run: (editor, range) => editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    title: "Code block",
    hint: "Monospaced snippet",
    keywords: ["code", "pre"],
    run: (editor, range) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    title: "Divider",
    hint: "Horizontal line",
    keywords: ["hr", "line"],
    run: (editor, range) => editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
];

export type SlashBridge = {
  onStart: (props: SuggestionProps<SlashItem>) => void;
  onUpdate: (props: SuggestionProps<SlashItem>) => void;
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
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
          const normalizedQuery = query.toLowerCase();
          return SLASH_ITEMS.filter(
            (item) =>
              item.title.toLowerCase().includes(normalizedQuery) ||
              item.keywords.some((keyword) => keyword.includes(normalizedQuery)),
          );
        },
        command: ({ editor, range, props }) => props.run(editor, range),
        render: () => ({
          onStart: (props) => bridge?.onStart(props),
          onUpdate: (props) => bridge?.onUpdate(props),
          onKeyDown: (props) => bridge?.onKeyDown(props) ?? false,
          onExit: () => bridge?.onExit(),
        }),
      }),
    ];
  },
});
