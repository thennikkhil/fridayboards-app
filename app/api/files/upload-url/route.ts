import { randomUUID } from "node:crypto";
import { z } from "zod";

import { assertBoardMember } from "@/lib/db/access";
import { connectDb } from "@/lib/db";
import { FileModel } from "@/lib/models/file";
import { getUserId, jsonError } from "@/lib/files";
import { MAX_PDF_BYTES, PDF_CONTENT_TYPE } from "@/lib/pdf-constants";
import { presignUpload } from "@/lib/r2";

const bodySchema = z.object({
  boardId: z.string().min(1),
  fileName: z.string().min(1).max(200),
  sizeBytes: z.number().int().positive().max(MAX_PDF_BYTES),
  contentType: z.literal(PDF_CONTENT_TYPE),
});

export async function POST(request: Request) {
  try {
    const userId = await getUserId(request);
    if (!userId) return jsonError(401, "Sign in to upload files.");

    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return jsonError(400, "That file can't be uploaded (PDF only, up to 16 MB).");
    }

    const { boardId, fileName, sizeBytes, contentType } = parsed.data;
    try {
      await assertBoardMember(userId, boardId);
    } catch {
      return jsonError(403, "You don't have access to this board.");
    }

    await connectDb();
    const key = `boards/${boardId}/${randomUUID()}.pdf`;
    const file = await FileModel.create({
      boardId,
      uploaderId: userId,
      key,
      name: fileName,
      sizeBytes,
      status: "pending",
    });

    const uploadUrl = await presignUpload(key, contentType);
    return Response.json({ fileId: String(file._id), uploadUrl });
  } catch (error) {
    console.error("[files] upload-url failed:", error);
    return jsonError(500, "Couldn't start the upload. Try again in a moment.");
  }
}
