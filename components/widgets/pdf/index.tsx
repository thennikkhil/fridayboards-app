"use client";

import { useParams } from "next/navigation";

import type { WidgetProps } from "@/components/widgets/registry";

import { PdfEmptyState } from "./pdf-empty-state";
import { PdfWidget } from "./pdf-widget";
import { PDF_DEFAULT_SIZE, PDF_MIN_SIZE } from "./use-insert-pdf-widget";

type PdfData = {
  fileId: string | null;
  fileName: string | null;
};

function PdfWidgetEntry({ data, updateData }: WidgetProps) {
  const { boardId } = useParams<{ boardId: string }>();
  const pdfData = data as PdfData;

  if (!pdfData.fileId) {
    return (
      <PdfEmptyState
        boardId={boardId}
        onUploaded={(pdf) =>
          updateData({ fileId: pdf.fileId, fileName: pdf.fileName })
        }
      />
    );
  }

  return (
    <PdfWidget
      fileId={pdfData.fileId}
      fileName={pdfData.fileName ?? "document.pdf"}
    />
  );
}

export const pdfWidget = {
  type: "pdf",
  name: "PDF",
  icon: "📄",
  defaultSize: PDF_DEFAULT_SIZE,
  minSize: PDF_MIN_SIZE,
  initialData: () => ({ fileId: null, fileName: null }) as PdfData,
  Component: PdfWidgetEntry,
};
