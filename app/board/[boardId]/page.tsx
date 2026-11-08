import { notFound, redirect } from "next/navigation"
import { connectDb } from "@/lib/db"
import { Board, Workspace } from "@/lib/models"
import { getUser, isMember } from "@/lib/session"
import { Whiteboard } from "@/components/whiteboard"

export const dynamic = "force-dynamic"

export default async function BoardPage({ params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = await params
  const user = await getUser()
  if (!user) redirect(`/auth?next=/board/${boardId}`)
  await connectDb()
  const board = await Board.findById(boardId).lean<any>().catch(() => null)
  if (!board) notFound()
  if (!(await isMember(user.id, board.workspaceId))) redirect("/dashboard")
  const ws = await Workspace.findById(board.workspaceId).lean<any>()
  return <Whiteboard board={{ id: boardId, title: board.title }} user={{ name: user.name }} inviteCode={ws.inviteCode} />
}
