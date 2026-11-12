"use client";
// app/(app)/board/[boardId]/_widgets/notes/NotesWidget.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TaskList, TaskItem } from "@tiptap/extension-list"; // v2: @tiptap/extension-task-list / -task-item
import { Placeholder } from "@tiptap/extensions";            // v2: @tiptap/extension-placeholder
import Highlight from "@tiptap/extension-highlight";
import { useLiveblocksExtension } from "@liveblocks/react-tiptap";
import { SlashCommand, type SlashItem, type SlashBridge } from "./slash-command";
import type { SuggestionProps } from "@tiptap/suggestion";
import "@liveblocks/react-tiptap/styles.css";
import "./notes.css";

type Props = {
  widgetId: string;                 // unique per widget -> its own Yjs field
  scale: number;                    // current canvas camera scale
  isLocked?: boolean;
};

type MenuState = { items: SlashItem[]; x: number; y: number; props: SuggestionProps<SlashItem> } | null;

export function NotesWidget({ widgetId, scale, isLocked }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<MenuState>(null);
  const [index, setIndex] = useState(0);
  const menuRef = useRef<MenuState>(null);
  const indexRef = useRef(0);
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  menuRef.current = menu;
  indexRef.current = index;

  // Convert the caret's screen rect into widget-local coordinates, undoing the canvas zoom.
  const place = (p: SuggestionProps<SlashItem>): MenuState => {
    const rect = p.clientRect?.();
    const root = rootRef.current;
    if (!rect || !root) return null;
    const box = root.getBoundingClientRect();
    const s = scaleRef.current || 1;
    return { items: p.items, props: p, x: (rect.left - box.left) / s, y: (rect.bottom - box.top) / s + 4 };
  };

  const bridge = useMemo<SlashBridge>(
    () => ({
      onStart: (p) => { setIndex(0); setMenu(place(p)); },
      onUpdate: (p) => { setIndex(0); setMenu(place(p)); },
      onExit: () => setMenu(null),
      onKeyDown: ({ event }) => {
        const m = menuRef.current;
        if (!m || m.items.length === 0) return false;
        if (event.key === "ArrowDown") { setIndex((i) => (i + 1) % m.items.length); return true; }
        if (event.key === "ArrowUp")   { setIndex((i) => (i - 1 + m.items.length) % m.items.length); return true; }
        if (event.key === "Enter")     { m.props.command(m.items[indexRef.current]); return true; }
        if (event.key === "Escape")    { setMenu(null); return true; }
        return false;
      },
    }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // One Yjs field per notes widget, so several notes widgets can share one Liveblocks room.
  const liveblocks = useLiveblocksExtension({ field: `notes-${widgetId}` });

  const editor = useEditor({
    immediatelyRender: false, // avoids Next.js SSR hydration mismatch
    editable: !isLocked,
    extensions: [
      liveblocks,
      // Liveblocks/Yjs brings its own undo history, so turn Tiptap's off.
      // Tiptap v3: undoRedo: false   |   v2: history: false
      StarterKit.configure({ undoRedo: false }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight,
      Placeholder.configure({ placeholder: "Type '/' for commands…" }),
      SlashCommand.configure({ bridge }),
    ],
    editorProps: { attributes: { class: "notes-prose", spellcheck: "true" } },
  });

  useEffect(() => { editor?.setEditable(!isLocked); }, [editor, isLocked]);

  return (
    <div
      ref={rootRef}
      data-no-shortcuts            // canvas shortcut handler ignores keys from here
      className="relative h-full w-full overflow-y-auto bg-background"
      onWheel={(e) => e.stopPropagation()}   // scrolling notes never pans/zooms the canvas
      onPointerDown={(e) => e.stopPropagation()} // clicking inside never starts a canvas gesture
    >
      <EditorContent editor={editor} className="min-h-full" />

      {menu && menu.items.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 w-60 rounded-lg border bg-popover p-1 shadow-lg"
          style={{ left: menu.x, top: menu.y }}
        >
          {menu.items.map((item, i) => (
            <li
              key={item.title}
              role="option"
              aria-selected={i === index}
              onMouseEnter={() => setIndex(i)}
              onMouseDown={(e) => { e.preventDefault(); menu.props.command(item); }}
              className={`cursor-pointer rounded-md px-2 py-1.5 text-sm ${
                i === index ? "bg-accent text-accent-foreground" : ""
              }`}
            >
              <div className="font-medium">{item.title}</div>
              <div className="text-xs text-muted-foreground">{item.hint}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
