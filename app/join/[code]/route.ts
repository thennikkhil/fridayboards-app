import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/session"
import { connectDb } from "@/lib/db"
import { Membership, Workspace } from "@/lib/models"

function isSafeBoard(val: string | null): val is string {
  return typeof val === "string" && /^[0-9a-f]{24}$/.test(val)
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const boardParam = req.nextUrl.searchParams.get("board")
  const board = isSafeBoard(boardParam) ? boardParam : null
  const user = await getUser()
  if (!user) return NextResponse.redirect(new URL(`/auth?next=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`, req.url))
  await connectDb()
  const ws = await Workspace.findOne({ inviteCode: code }).lean<any>()
  if (!ws) return NextResponse.redirect(new URL("/dashboard", req.url))
  await Membership.updateOne({ workspaceId: String(ws._id), userId: user.id }, { $setOnInsert: { role: "member" } }, { upsert: true })
  const res = NextResponse.redirect(new URL(board ? `/board/${board}` : "/dashboard", req.url))
  res.cookies.set("ws", String(ws._id), { path: "/", httpOnly: true, sameSite: "lax" })
  return res
}
