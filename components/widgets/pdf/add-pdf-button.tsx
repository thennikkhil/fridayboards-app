"use client";

import { FileText } from "lucide-react";
import { useRef, type RefObject } from "react";

import { PDF_DEFAULT_SIZE, useInsertPdfWidget } from "./use-insert-pdf-widget";
import { usePdfUpload } from "./use-pdf-upload";

type Camera = { x: number; y: number; scale: number };

export function AddPdfButton({
  canvasRef,
  camera,
  boardId,
  userId,
}: {
  canvasRef: RefObject<HTMLElement | null>;
  camera: Camera;
  boardId: string;
  userId: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, isUploading } = usePdfUpload(boardId);
  const insert = useInsertPdfWidget();

  const onPick = async (file?: File) => {
    if (!file) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    const centerX = (((rect?.width ?? 800) / 2) - camera.x) / camera.scale;
    const centerY = (((rect?.height ?? 600) / 2) - camera.y) / camera.scale;
    const uploaded = await upload(file);
    if (!uploaded) return;

    insert(
      uploaded,
      {
        x: centerX - PDF_DEFAULT_SIZE.w / 2,
        y: centerY - PDF_DEFAULT_SIZE.h / 2,
      },
      userId,
    );
  };

  return (
    <>
      <button
        type="button"
        title="Add PDF"
        aria-label="Add PDF"
        data-tip={isUploading ? "Uploading PDF…" : "Add PDF"}
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
      >
        <FileText size={21} />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(event) => {
          void onPick(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </>
  );
}
