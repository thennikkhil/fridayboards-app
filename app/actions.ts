"use server"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { connectDb } from "@/lib/db"
import { deleteBoardFiles } from "@/lib/files"
import { Board, Favorite, Membership } from "@/lib/models"
import { createWorkspaceFor, getWorkspaces, isMember, requireUser } from "@/lib/session"

const title = z.string().trim().min(1).max(80)

async function boardAccess(boardId: string) {
  const user = await requireUser()
  await connectDb()
  const board = await Board.findById(boardId).lean<any>()
  if (!board || !(await isMember(user.id, board.workspaceId))) throw new Error("Not allowed")
  return { user, board }
}

export async function createWorkspace(name: string) {
  const user = await requireUser()
  const ws = await createWorkspaceFor(user.id, title.parse(name))
  ;(await cookies()).set("ws", String(ws._id), { path: "/" })
  revalidatePath("/dashboard")
  return String(ws._id)
}

export async function switchWorkspace(id: string) {
  const user = await requireUser()
  if (!(await isMember(user.id, id))) throw new Error("Not allowed")
  ;(await cookies()).set("ws", id, { path: "/" })
  revalidatePath("/dashboard")
}

export async function createBoard(input: { title?: string; template?: string }) {
  const user = await requireUser()
  const { current } = await getWorkspaces(user) // workspace derived on the server
  const b = await Board.create({
    workspaceId: current.id,
    ownerId: user.id,
    title: title.catch("Untitled masterpiece").parse(input.title ?? ""),
    template: input.template ?? "Blank canvas",
  })
  revalidatePath("/dashboard")
  return String(b._id)
}

export async function renameBoard(id: string, t: string) {
  const { board } = await boardAccess(id)
  await Board.updateOne({ _id: board._id }, { title: title.parse(t) })
  revalidatePath("/dashboard")
}

export async function deleteBoard(id: string) {
  const { user, board } = await boardAccess(id)
  const ws = await Membership.findOne({ workspaceId: board.workspaceId, userId: user.id }).lean<any>()
  if (board.ownerId !== user.id && ws?.role !== "owner") throw new Error("Only the board or workspace owner can delete")
  await deleteBoardFiles(id)
  await Promise.all([Board.deleteOne({ _id: board._id }), Favorite.deleteMany({ boardId: id })])
  revalidatePath("/dashboard")
}

export async function toggleFavorite(id: string) {
  const { user } = await boardAccess(id)
  const r = await Favorite.deleteOne({ userId: user.id, boardId: id })
  if (!r.deletedCount) await Favorite.create({ userId: user.id, boardId: id })
  revalidatePath("/dashboard")
}
