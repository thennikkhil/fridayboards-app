import { connectDb } from "@/lib/db";
import { Board, Membership } from "@/lib/models";

export class BoardAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BoardAccessError";
  }
}

/** Throws unless `userId` belongs to the workspace that owns `boardId`. */
export async function assertBoardMember(userId: string, boardId: string) {
  await connectDb();
  const board = await Board.findById(boardId).select("workspaceId").lean<{ workspaceId: string }>();
  if (!board) throw new BoardAccessError("Board not found");
  const member = await Membership.exists({ workspaceId: board.workspaceId, userId });
  if (!member) throw new BoardAccessError("Not a member of this workspace");
}
