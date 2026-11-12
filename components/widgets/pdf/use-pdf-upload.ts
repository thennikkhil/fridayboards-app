"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

import { MAX_PDF_BYTES, PDF_CONTENT_TYPE } from "@/lib/pdf-constants";

export { MAX_PDF_BYTES };

export type UploadedPdf = { fileId: string; fileName: string };

export function isPdf(file: File) {
  return file.type === PDF_CONTENT_TYPE || file.name.toLowerCase().endsWith(".pdf");
}

async function readError(response: Response): Promise<string> {
  const data = await response.json().catch(() => null);
  return data?.error ?? `Request failed (${response.status}).`;
}

export function usePdfUpload(boardId: string) {
  const [isUploading, setIsUploading] = useState(false);

  const upload = useCallback(
    async (file: File): Promise<UploadedPdf | null> => {
      if (!isPdf(file)) {
        toast.error("Only PDF files can be added to a board.");
        return null;
      }
      if (file.size > MAX_PDF_BYTES) {
        toast.error("That PDF is larger than 16 MB. Try a smaller file.");
        return null;
      }

      setIsUploading(true);
      const toastId = toast.loading(`Uploading ${file.name}…`);
      try {
        const init = await fetch("/api/files/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            boardId,
            fileName: file.name,
            sizeBytes: file.size,
            contentType: PDF_CONTENT_TYPE,
          }),
        });
        if (!init.ok) throw new Error(await readError(init));
        const { fileId, uploadUrl } = (await init.json()) as { fileId: string; uploadUrl: string };

        const put = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": PDF_CONTENT_TYPE },
          body: file,
        });
        if (!put.ok) throw new Error(`Storage rejected the upload (${put.status}).`);

        const confirmed = await fetch(`/api/files/${fileId}/confirm`, { method: "POST" });
        if (!confirmed.ok) throw new Error(await readError(confirmed));

        toast.success(`${file.name} added`, { id: toastId });
        return { fileId, fileName: file.name };
      } catch (error) {
        console.error(error);
        const message =
          error instanceof TypeError
            ? "Couldn't reach file storage. Check your connection and the bucket's CORS rule."
            : error instanceof Error
              ? error.message
              : `Couldn't upload ${file.name}.`;
        toast.error(message, { id: toastId });
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [boardId],
  );

  return { upload, isUploading };
}
