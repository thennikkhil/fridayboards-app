"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { AnnotationLayer, AnnotationMenu, annotationPlugin, useAnnotation, useAnnotationState } from "@embedpdf/react/annotation";
import { commandsPlugin, standardCommands, useCommandShortcuts, useCommandsEvent } from "@embedpdf/react/commands";
import { historyPlugin } from "@embedpdf/react/history";
import { interactionPlugin } from "@embedpdf/react/interaction";
import { RenderLayer, renderPlugin } from "@embedpdf/react/render";
import { DocumentGate, Viewer } from "@embedpdf/react/runtime";
import {
  SelectionClipboard,
  SelectionHandles,
  SelectionLayer,
  SelectionMenu,
  copySelection,
  selectionPlugin,
  useSelection,
} from "@embedpdf/react/selection";
import { Stage, stagePlugin } from "@embedpdf/react/stage";

import { CANVAS_IGNORE_ATTR } from "@/lib/utils/widget-events";

import { PdfToolbar } from "./pdf-toolbar";

type Props = { fileId: string; fileName: string };

function usePdfEngine() {
  const [engine, setEngine] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    void import("@embedpdf/engine").then(({ localEngine }) => {
      if (!cancelled) setEngine(localEngine());
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return engine;
}

function usePdfBytes(fileId: string) {
  const [state, setState] = useState<{ bytes?: Uint8Array; error?: string }>({});

  useEffect(() => {
    const controller = new AbortController();
    setState({});
    void (async () => {
      try {
        const linkResponse = await fetch(`/api/files/${fileId}/url`, { signal: controller.signal });
        if (linkResponse.status === 403) throw new Error("You don't have access to this file.");
        if (linkResponse.status === 404) throw new Error("This PDF is no longer available.");
        if (!linkResponse.ok) throw new Error("Couldn't get the file link.");
        const { url } = (await linkResponse.json()) as { url: string };

        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`File storage returned ${response.status}.`);
        setState({ bytes: new Uint8Array(await response.arrayBuffer()) });
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("PDF load failed", err);
        setState({
          error:
            err instanceof TypeError
              ? "Couldn't reach file storage. Check the bucket's CORS rule."
              : err instanceof Error
                ? err.message
                : "This PDF couldn't be loaded.",
        });
      }
    })();
    return () => controller.abort();
  }, [fileId]);

  return state;
}

function SelectionActions() {
  const selection = useSelection();
  return (
    <div className="flex gap-1 rounded-lg border bg-popover p-1 text-popover-foreground shadow-md">
      {selection.canCopy() && (
        <button
          type="button"
          className="rounded-md px-2.5 py-1 text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() =>
            void copySelection(selection)
              .then(() => selection.clear())
              .catch(() => toast.error("Your browser blocked copying."))
          }
        >
          Copy
        </button>
      )}
      <button
        type="button"
        className="rounded-md px-2.5 py-1 text-sm text-muted-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => selection.clear()}
      >
        Clear
      </button>
    </div>
  );
}

/**
 * Clears the text selection after the "copy" command runs (e.g. Ctrl+C),
 * so copied text goes back to normal immediately.
 */
function CopyThenClear() {
  const selection = useSelection();
  useCommandsEvent(
    (commands) => commands.onExecuted,
    (event) => {
      if (event.commandId === "copy") {
        selection.clear();
      }
    },
  );
  return null;
}

/** Floating menu that appears when one or more annotations are selected. */
function AnnotationActions() {
  const annotation = useAnnotation();
  const { selected } = useAnnotationState((s) => ({ selected: s.selected }));

  if (!selected.length) return null;

  return (
    <div className="flex gap-1 rounded-lg border bg-popover p-1 text-popover-foreground shadow-md">
      <button
        type="button"
        title="Delete selected annotation (Delete)"
        aria-label="Delete selected annotation"
        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => void annotation.selection.delete().catch(() => toast.error("Couldn't delete the annotation."))}
      >
        <Trash2 className="size-3.5" />
        Delete
      </button>
    </div>
  );
}

/** Wires standard keyboard shortcuts (Ctrl+C for copy, Delete to erase, Ctrl+Z for undo, etc.) */
function PdfShortcuts({ target }: { target: React.RefObject<HTMLElement | null> }) {
  useCommandShortcuts({ target });
  return null;
}

function Loading() {
  return (
    <div className="flex h-full flex-col gap-3 p-4" aria-busy="true">
      <div className="h-8 w-2/3 animate-pulse rounded-md bg-muted" />
      <div className="min-h-0 flex-1 animate-pulse rounded-md bg-muted" />
    </div>
  );
}

export function PdfWidget({ fileId, fileName }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const engine = usePdfEngine();
  const { bytes, error } = usePdfBytes(fileId);

  const plugins = useMemo(
    () => [
      stagePlugin(),
      renderPlugin(),
      interactionPlugin(),
      selectionPlugin(),
      annotationPlugin(),
      historyPlugin(),
      commandsPlugin({ commands: [...standardCommands] }),
    ],
    [],
  );

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const stop = (e: WheelEvent) => e.stopPropagation();
    el.addEventListener("wheel", stop, { passive: true });
    return () => el.removeEventListener("wheel", stop);
  }, []);

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      {...{ [CANVAS_IGNORE_ATTR]: "" }}
      onPointerDown={() => rootRef.current?.focus({ preventScroll: true })}
      className="flex h-full w-full flex-col overflow-hidden bg-muted/40 outline-none"
    >
      {error ? (
        <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
          {error} Check your connection, then close and re-add the widget.
        </div>
      ) : !bytes || !engine ? (
        <Loading />
      ) : (
        <Viewer
          engine={engine}
          plugins={plugins}
          initialDocuments={[
            {
              source: async () => ({ kind: "bytes", id: fileId, bytes: bytes.slice() }),
            },
          ]}
        >
          <DocumentGate fallback={<Loading />}>
            <PdfToolbar fileName={fileName} />
            <SelectionClipboard target={rootRef} />
            <PdfShortcuts target={rootRef} />
            <CopyThenClear />
            <Stage
              className="min-h-0 flex-1"
              overlay={
                <>
                  <SelectionMenu placement="top" gap={8}>
                    <SelectionActions />
                  </SelectionMenu>
                  <SelectionHandles />
                  <AnnotationMenu placement="top" gap={8}>
                    <AnnotationActions />
                  </AnnotationMenu>
                </>
              }
            >
              {() => (
                <>
                  <RenderLayer />
                  <SelectionLayer />
                  <AnnotationLayer />
                </>
              )}
            </Stage>
          </DocumentGate>
        </Viewer>
      )}
    </div>
  );
}
