"use client";

import { LiveMap, LiveObject } from "@liveblocks/client";
import { useMutation } from "@liveblocks/react";
import { nanoid } from "nanoid";

import type { WidgetLayer } from "@/lib/liveblocks-types";

import type { UploadedPdf } from "./use-pdf-upload";

export const PDF_DEFAULT_SIZE = { w: 640, h: 820 };
export const PDF_MIN_SIZE = { w: 360, h: 320 };

/**
 * Adds a PDF widget layer to the shared board.
 * `at` is a WORLD position (top-left of the widget), not a screen position.
 */
export function useInsertPdfWidget() {
  return useMutation(
    ({ storage }, pdf: UploadedPdf, at: { x: number; y: number }, userId: string) => {
      let m = storage.get("widgets");
      if (!m) {
        m = new LiveMap<string, LiveObject<WidgetLayer>>();
        storage.set("widgets", m);
      }

      const id = nanoid();
      m.set(
        id,
        new LiveObject<WidgetLayer>({
          widgetType: "pdf",
          x: at.x,
          y: at.y,
          w: PDF_DEFAULT_SIZE.w,
          h: PDF_DEFAULT_SIZE.h,
          title: pdf.fileName,
          isCollapsed: false,
          isLocked: false,
          createdBy: userId,
          z: Date.now(),
          data: new LiveObject({
            fileId: pdf.fileId,
            fileName: pdf.fileName,
            currentPage: 1,
            followMe: false,
          }),
        }),
      );
      return id;
    },
    [],
  );
}
