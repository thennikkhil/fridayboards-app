"use client";

import {
  Circle,
  Download,
  Highlighter,
  MousePointer2,
  Pencil,
  Redo2,
  Square,
  StickyNote,
  Type,
  Underline,
  Undo2,
  ZoomIn,
  ZoomOut,
  type LucideIcon,
} from "lucide-react";

import { useHistory, useHistoryState } from "@embedpdf/react/history";
import { useInteraction, useInteractionState } from "@embedpdf/react/interaction";
import { saveFile, useDocuments } from "@embedpdf/react/runtime";
import { useStage, useStageState } from "@embedpdf/react/stage";

const TOOLS: { id: string; label: string; Icon: LucideIcon }[] = [
  { id: "pointer", label: "Select text or marks", Icon: MousePointer2 },
  { id: "highlight", label: "Highlight text", Icon: Highlighter },
  { id: "underline", label: "Underline text", Icon: Underline },
  { id: "ink", label: "Pen", Icon: Pencil },
  { id: "square", label: "Rectangle", Icon: Square },
  { id: "circle", label: "Ellipse", Icon: Circle },
  { id: "freeText", label: "Text box", Icon: Type },
  { id: "text", label: "Sticky note", Icon: StickyNote },
];

const buttonClass =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground " +
  "transition-colors hover:bg-accent hover:text-accent-foreground " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
  "aria-pressed:bg-primary aria-pressed:text-primary-foreground";

export function PdfToolbar({ fileName }: { fileName: string }) {
  const interaction = useInteraction();
  const { activeToolId } = useInteractionState();
  const stage = useStage();
  const { zoomLevel } = useStageState();
  const documents = useDocuments();
  const history = useHistory();
  const { canUndo, canRedo } = useHistoryState((s) => ({ canUndo: s.canUndo, canRedo: s.canRedo }));

  const download = async () => {
    const base = fileName.replace(/\.pdf$/i, "");
    saveFile(await documents.download(), `${base}-marked.pdf`);
  };

  return (
    <div
      role="toolbar"
      aria-label="PDF tools"
      className="flex shrink-0 items-center gap-0.5 overflow-x-auto border-b bg-background px-2 py-1"
    >
      {TOOLS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          title={label}
          aria-label={label}
          aria-pressed={activeToolId === id}
          className={buttonClass}
          onClick={() => interaction.activateTool(id)}
        >
          <Icon className="size-4" />
        </button>
      ))}

      <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden />

      {/* Undo / Redo */}
      <button
        type="button"
        title="Undo (Ctrl+Z)"
        aria-label="Undo"
        className={buttonClass}
        disabled={!canUndo}
        onClick={() => void history.undo()}
      >
        <Undo2 className="size-4" />
      </button>
      <button
        type="button"
        title="Redo (Ctrl+Shift+Z)"
        aria-label="Redo"
        className={buttonClass}
        disabled={!canRedo}
        onClick={() => void history.redo()}
      >
        <Redo2 className="size-4" />
      </button>

      <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden />

      <button type="button" title="Zoom out" aria-label="Zoom out" className={buttonClass} onClick={() => stage.zoomOut()}>
        <ZoomOut className="size-4" />
      </button>
      <span className="w-11 shrink-0 text-center text-xs tabular-nums text-muted-foreground">
        {Math.round(zoomLevel * 100)}%
      </span>
      <button type="button" title="Zoom in" aria-label="Zoom in" className={buttonClass} onClick={() => stage.zoomIn()}>
        <ZoomIn className="size-4" />
      </button>

      <span className="ml-auto" />
      <button
        type="button"
        title="Download PDF with your marks"
        aria-label="Download PDF with your marks"
        className={buttonClass}
        onClick={download}
      >
        <Download className="size-4" />
      </button>
    </div>
  );
}
