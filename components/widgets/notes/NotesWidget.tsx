"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { Placeholder } from "@tiptap/extensions";
import Highlight from "@tiptap/extension-highlight";
import FontFamily from "@tiptap/extension-font-family";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import { useLiveblocksExtension } from "@liveblocks/react-tiptap";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading,
  Highlighter,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import type { WidgetProps } from "../registry";
import { SlashCommand, type SlashBridge, type SlashItem } from "./slash-command";
import type { SuggestionProps } from "@tiptap/suggestion";
import "@liveblocks/react-tiptap/styles.css";
import "./notes.css";

declare module "@tiptap/extension-text-style" {
  interface TextStyleAttributes {
    fontSize?: string | null;
  }
}

const FontSize = Extension.create({
  name: "fontSize",
  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize || null,
            renderHTML: (attributes) =>
              attributes.fontSize ? { style: `font-size: ${attributes.fontSize}` } : {},
          },
        },
      },
    ];
  },
});

const FONT_FAMILIES = [
  { label: "Default", value: "" },
  { label: "Sans serif", value: "Arial, sans-serif" },
  { label: "Serif", value: "Georgia, serif" },
  { label: "Monospace", value: "ui-monospace, monospace" },
  { label: "Handwritten", value: "cursive" },
];

const FONT_SIZES = ["12px", "14px", "16px", "18px", "24px", "32px", "48px"];

type MenuState = {
  items: SlashItem[];
  x: number;
  y: number;
  props: SuggestionProps<SlashItem>;
} | null;

export function NotesWidget({ widgetId, scale, isLocked }: WidgetProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<MenuState>(null);
  const [index, setIndex] = useState(0);
  const menuRef = useRef<MenuState>(null);
  const indexRef = useRef(0);
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  menuRef.current = menu;
  indexRef.current = index;

  const place = (props: SuggestionProps<SlashItem>): MenuState => {
    const rect = props.clientRect?.();
    const root = rootRef.current;
    if (!rect || !root) return null;
    const box = root.getBoundingClientRect();
    const currentScale = scaleRef.current || 1;
    return {
      items: props.items,
      props,
      x: (rect.left - box.left) / currentScale,
      y: (rect.bottom - box.top) / currentScale + 4,
    };
  };

  const bridge = useMemo<SlashBridge>(
    () => ({
      onStart: (props) => {
        setIndex(0);
        setMenu(place(props));
      },
      onUpdate: (props) => {
        setIndex(0);
        setMenu(place(props));
      },
      onExit: () => setMenu(null),
      onKeyDown: ({ event }) => {
        const currentMenu = menuRef.current;
        if (!currentMenu || currentMenu.items.length === 0) return false;
        if (event.key === "ArrowDown") {
          setIndex((current) => (current + 1) % currentMenu.items.length);
          return true;
        }
        if (event.key === "ArrowUp") {
          setIndex((current) => (current - 1 + currentMenu.items.length) % currentMenu.items.length);
          return true;
        }
        if (event.key === "Enter") {
          currentMenu.props.command(currentMenu.items[indexRef.current]);
          return true;
        }
        if (event.key === "Escape") {
          setMenu(null);
          return true;
        }
        return false;
      },
    }),
    [],
  );

  const liveblocks = useLiveblocksExtension({ field: `notes-${widgetId}` });
  const editor = useEditor({
    immediatelyRender: false,
    editable: !isLocked,
    extensions: [
      liveblocks,
      StarterKit.configure({ undoRedo: false }),
      TextStyle,
      FontFamily,
      Color,
      FontSize,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight,
      Placeholder.configure({ placeholder: "Type '/' for commands…" }),
      SlashCommand.configure({ bridge }),
    ],
    editorProps: { attributes: { class: "notes-prose", spellcheck: "true" } },
  });
  const editorState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (!currentEditor) return null;
      return {
        bold: currentEditor.isActive("bold"),
        italic: currentEditor.isActive("italic"),
        underline: currentEditor.isActive("underline"),
        strike: currentEditor.isActive("strike"),
        highlight: currentEditor.isActive("highlight"),
        bulletList: currentEditor.isActive("bulletList"),
        orderedList: currentEditor.isActive("orderedList"),
        align:
          currentEditor.getAttributes("heading").textAlign ??
          currentEditor.getAttributes("paragraph").textAlign ??
          "left",
        fontFamily: currentEditor.getAttributes("textStyle").fontFamily ?? "",
        fontSize: currentEditor.getAttributes("textStyle").fontSize ?? "16px",
        color: currentEditor.getAttributes("textStyle").color ?? "#24231f",
        heading: [1, 2, 3].find((level) => currentEditor.isActive("heading", { level })) ?? 0,
        canUndo: currentEditor.can().undo(),
        canRedo: currentEditor.can().redo(),
      };
    },
  });

  useEffect(() => {
    editor?.setEditable(!isLocked);
  }, [editor, isLocked]);

  return (
    <div
      ref={rootRef}
      data-canvas-ignore=""
      className="notes-editor-root"
      onWheel={(event) => event.stopPropagation()}
    >
      <div className="notes-toolbar" role="toolbar" aria-label="Note formatting">
        <select
          aria-label="Text style"
          title="Text style"
          value={editorState?.heading ?? 0}
          disabled={!editor || isLocked}
          onChange={(event) => {
            const level = Number(event.target.value);
            if (level === 0) editor?.chain().focus().setParagraph().run();
            else editor?.chain().focus().setHeading({ level: level as 1 | 2 | 3 }).run();
          }}
        >
          <option value={0}>Paragraph</option>
          <option value={1}>Heading 1</option>
          <option value={2}>Heading 2</option>
          <option value={3}>Heading 3</option>
        </select>
        <select
          aria-label="Font family"
          title="Font family"
          value={editorState?.fontFamily ?? ""}
          disabled={!editor || isLocked}
          onChange={(event) => {
            const fontFamily = event.target.value;
            const chain = editor?.chain().focus();
            if (!chain) return;
            if (fontFamily) chain.setFontFamily(fontFamily).run();
            else chain.unsetFontFamily().run();
          }}
        >
          {FONT_FAMILIES.map((font) => (
            <option key={font.label} value={font.value}>{font.label}</option>
          ))}
          {editorState?.fontFamily &&
            !FONT_FAMILIES.some((font) => font.value === editorState.fontFamily) && (
              <option value={editorState.fontFamily}>{editorState.fontFamily}</option>
            )}
        </select>
        <select
          aria-label="Font size"
          title="Font size"
          value={editorState?.fontSize ?? "16px"}
          disabled={!editor || isLocked}
          onChange={(event) => {
            editor
              ?.chain()
              .focus()
              .setMark("textStyle", { fontSize: event.target.value })
              .run();
          }}
        >
          {editorState?.fontSize &&
            !FONT_SIZES.includes(editorState.fontSize) && (
              <option value={editorState.fontSize}>{editorState.fontSize}</option>
            )}
          {FONT_SIZES.map((fontSize) => (
            <option key={fontSize} value={fontSize}>{fontSize}</option>
          ))}
        </select>
        <ToolbarButton
          label="Bold"
          active={editorState?.bold}
          disabled={!editor || isLocked}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={editorState?.italic}
          disabled={!editor || isLocked}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic />
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          active={editorState?.underline}
          disabled={!editor || isLocked}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon />
        </ToolbarButton>
        <ToolbarButton
          label="Strikethrough"
          active={editorState?.strike}
          disabled={!editor || isLocked}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
        >
          <Strikethrough />
        </ToolbarButton>
        <label className="notes-color-control" title="Text color">
          <span className="sr-only">Text color</span>
          <input
            type="color"
            aria-label="Text color"
            value={editorState?.color ?? "#24231f"}
            disabled={!editor || isLocked}
            onChange={(event) => editor?.chain().focus().setColor(event.target.value).run()}
          />
        </label>
        <ToolbarButton
          label="Highlight"
          active={editorState?.highlight}
          disabled={!editor || isLocked}
          onClick={() => editor?.chain().focus().toggleHighlight().run()}
        >
          <Highlighter />
        </ToolbarButton>
        <span className="notes-toolbar-divider" aria-hidden="true" />
        <ToolbarButton
          label="Align left"
          active={editorState?.align === "left"}
          disabled={!editor || isLocked}
          onClick={() => editor?.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft />
        </ToolbarButton>
        <ToolbarButton
          label="Align center"
          active={editorState?.align === "center"}
          disabled={!editor || isLocked}
          onClick={() => editor?.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter />
        </ToolbarButton>
        <ToolbarButton
          label="Align right"
          active={editorState?.align === "right"}
          disabled={!editor || isLocked}
          onClick={() => editor?.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight />
        </ToolbarButton>
        <ToolbarButton
          label="Bulleted list"
          active={editorState?.bulletList}
          disabled={!editor || isLocked}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          active={editorState?.orderedList}
          disabled={!editor || isLocked}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered />
        </ToolbarButton>
        <span className="notes-toolbar-divider" aria-hidden="true" />
        <ToolbarButton
          label="Undo"
          disabled={!editor || isLocked || !editorState?.canUndo}
          onClick={() => editor?.chain().focus().undo().run()}
        >
          <Undo2 />
        </ToolbarButton>
        <ToolbarButton
          label="Redo"
          disabled={!editor || isLocked || !editorState?.canRedo}
          onClick={() => editor?.chain().focus().redo().run()}
        >
          <Redo2 />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} className="notes-editor-content" />
      {menu && menu.items.length > 0 && (
        <ul role="listbox" className="notes-slash-menu" style={{ left: menu.x, top: menu.y }}>
          {menu.items.map((item, itemIndex) => (
            <li
              key={item.title}
              role="option"
              aria-selected={itemIndex === index}
              onMouseEnter={() => setIndex(itemIndex)}
              onMouseDown={(event) => {
                event.preventDefault();
                menu.props.command(item);
              }}
              className={`notes-slash-option${itemIndex === index ? " is-active" : ""}`}
            >
              <span className="notes-slash-title">{item.title}</span>
              <span className="notes-slash-hint">{item.hint}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ToolbarButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  active?: boolean | null;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={Boolean(active)}
      title={label}
      disabled={disabled}
      className={`notes-toolbar-button${active ? " is-active" : ""}`}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
