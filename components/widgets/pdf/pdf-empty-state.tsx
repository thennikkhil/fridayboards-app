"use client";

import { FileUp } from "lucide-react";
import { useRef } from "react";

import type { UploadedPdf } from "./use-pdf-upload";
import { usePdfUpload } from "./use-pdf-upload";

/** Shown when a PDF widget was added from the picker and has no file yet. */
export function PdfEmptyState({
  boardId,
  onUploaded,
}: {
  boardId: string;
  onUploaded: (pdf: UploadedPdf) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, isUploading } = usePdfUpload(boardId);

  const pick = async (file?: File) => {
    if (!file) return;
    const uploaded = await upload(file);
    if (uploaded) onUploaded(uploaded);
  };

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <FileUp className="size-8 text-muted-foreground" aria-hidden />
      <div>
        <p className="font-medium">Add a PDF</p>
        <p className="text-sm text-muted-foreground">PDFs up to 16 MB. You can also drop one on the board.</p>
      </div>
      <button
        type="button"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
        style={{
          padding: "0.5rem 0.875rem",
          borderRadius: 10,
          border: "1px solid #d4d4d8",
          background: isUploading ? "#e4e4e7" : "#fff",
          cursor: isUploading ? "wait" : "pointer",
          fontWeight: 600,
        }}
      >
        {isUploading ? "Uploading…" : "Choose a PDF"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          void pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
