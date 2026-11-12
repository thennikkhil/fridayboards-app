import { assertBoardMember } from "@/lib/db/access";
import { connectDb } from "@/lib/db";
import { FileModel } from "@/lib/models/file";
import { getUserId, jsonError } from "@/lib/files";
import { presignDownload } from "@/lib/r2";

const EXPIRES_IN = 600;

export async function GET(request: Request, { params }: { params: Promise<{ fileId: string }> }) {
  try {
    const { fileId } = await params;
    const userId = await getUserId(request);
    if (!userId) return jsonError(401, "Sign in to view this file.");

    await connectDb();
    const file = await FileModel.findById(fileId).catch(() => null);
    if (!file || file.status !== "ready") return jsonError(404, "File not found.");

    try {
      await assertBoardMember(userId, file.boardId);
    } catch {
      return jsonError(403, "You don't have access to this file.");
    }

    const url = await presignDownload(file.key, file.name, EXPIRES_IN);
    return Response.json({ url, expiresIn: EXPIRES_IN });
  } catch (error) {
    console.error("[files] url failed:", error);
    return jsonError(500, "Couldn't load the file. Try again in a moment.");
  }
}
