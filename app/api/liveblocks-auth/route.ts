import { NextRequest } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { Board } from "@/lib/models"
import { isMember } from "@/lib/session"
import { liveblocks } from "@/lib/liveblocks"
import { colorFor } from "@/lib/colors"

function isValidObjectId(id: string) {
  return /^[0-9a-f]{24}$/.test(id)
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return new Response("Unauthorized", { status: 401 })
  const { room } = await req.json()
  if (typeof room !== "string" || !isValidObjectId(room))
    return new Response("Bad Request", { status: 400 })
  await connectDb()
  const board = await Board.findById(room).lean<any>().catch(() => null)
  if (!board || !(await isMember(session.user.id, board.workspaceId)))
    return new Response("Forbidden", { status: 403 })
  const s = liveblocks.prepareSession(session.user.id, {
    userInfo: { name: session.user.name, color: colorFor(session.user.id) },
  })
  s.allow(room, s.FULL_ACCESS)
  const { status, body } = await s.authorize()
  return new Response(body, { status })
}
