"use client";

import type { RefObject } from "react";
import { toast } from "sonner";

import { PDF_DEFAULT_SIZE, useInsertPdfWidget } from "./use-insert-pdf-widget";
import { isPdf, usePdfUpload } from "./use-pdf-upload";
import { usePdfDrop } from "./use-pdf-drop";

type Camera = { x: number; y: number; scale: number };

/**
 * Drop PDFs on the canvas: upload, then place a PDF widget where the file landed.
 * Returns `isOver` so the canvas can show a "Drop PDF to add it" overlay.
 */
export function useCanvasPdfDrop(opts: {
  canvasRef: RefObject<HTMLElement | null>;
  camera: Camera;
  boardId: string;
  userId: string;
}) {
  const { canvasRef, camera, boardId, userId } = opts;
  const { upload } = usePdfUpload(boardId);
  const insert = useInsertPdfWidget();

  return usePdfDrop(canvasRef, async (files, screen) => {
    const pdfs = files.filter(isPdf);
    if (pdfs.length === 0) {
      toast.error("Drop a PDF file to add it to the board.");
      return;
    }

    const worldX = (screen.x - camera.x) / camera.scale;
    const worldY = (screen.y - camera.y) / camera.scale;

    for (const [i, file] of pdfs.entries()) {
      const uploaded = await upload(file);
      if (!uploaded) continue;
      insert(
        uploaded,
        { x: worldX - PDF_DEFAULT_SIZE.w / 2 + i * 32, y: worldY - 24 + i * 32 },
        userId,
      );
    }
  });
}
