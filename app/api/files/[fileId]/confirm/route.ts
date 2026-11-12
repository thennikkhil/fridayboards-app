import { assertBoardMember } from "@/lib/db/access";
import { connectDb } from "@/lib/db";
import { FileModel } from "@/lib/models/file";
import { getUserId, jsonError } from "@/lib/files";
import { MAX_PDF_BYTES } from "@/lib/pdf-constants";
import { deleteObject, headObject, readFirstBytes } from "@/lib/r2";

export async function POST(request: Request, { params }: { params: Promise<{ fileId: string }> }) {
  try {
    const { fileId } = await params;
    const userId = await getUserId(request);
    if (!userId) return jsonError(401, "Sign in to upload files.");

    await connectDb();
    const file = await FileModel.findById(fileId).catch(() => null);
    if (!file || file.uploaderId !== userId) return jsonError(404, "File not found.");

    try {
      await assertBoardMember(userId, file.boardId);
    } catch {
      return jsonError(403, "You don't have access to this board.");
    }
    if (file.status === "ready") return Response.json({ fileId });

    const reject = async (message: string) => {
      await deleteObject(file.key);
      await FileModel.deleteOne({ _id: file._id });
      return jsonError(400, message);
    };

    let size: number;
    try {
      ({ size } = await headObject(file.key));
    } catch {
      return jsonError(400, "The upload didn't arrive. Please try again.");
    }
    if (size > MAX_PDF_BYTES) return reject("That PDF is larger than 16 MB.");

    const header = new TextDecoder().decode(await readFirstBytes(file.key, 5));
    if (header !== "%PDF-") return reject("That file isn't a valid PDF.");

    file.status = "ready";
    file.sizeBytes = size;
    await file.save();
    return Response.json({ fileId });
  } catch (error) {
    console.error("[files] confirm failed:", error);
    return jsonError(500, "Couldn't finish the upload. Try again in a moment.");
  }
}
