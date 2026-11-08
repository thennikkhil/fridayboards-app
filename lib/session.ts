import { headers, cookies } from "next/headers"
import { redirect } from "next/navigation"
import { nanoid } from "nanoid"
import { auth } from "./auth"
import { connectDb } from "./db"
import { Workspace, Membership } from "./models"

export async function getUser() {
  const s = await auth.api.getSession({ headers: await headers() })
  return s?.user ?? null
}

export async function requireUser() {
  const u = await getUser()
  if (!u) redirect("/auth")
  return u
}

export async function createWorkspaceFor(userId: string, name: string) {
  await connectDb()
  const ws = await Workspace.create({ name, ownerId: userId, inviteCode: nanoid(10) })
  await Membership.create({ workspaceId: String(ws._id), userId, role: "owner" })
  return ws
}

/** Workspaces the user belongs to + the current one (cookie, else first). Creates a default one if none. */
export async function getWorkspaces(user: { id: string; name: string }) {
  await connectDb()
  let ms = await Membership.find({ userId: user.id }).lean()
  if (!ms.length) {
    await createWorkspaceFor(user.id, `${user.name.split(" ")[0]}'s space`)
    ms = await Membership.find({ userId: user.id }).lean()
  }
  const list = (await Workspace.find({ _id: { $in: ms.map((m: any) => m.workspaceId) } }).sort({ createdAt: 1 }).lean()).map((w: any) => ({
    id: String(w._id), name: w.name, inviteCode: w.inviteCode as string,
  }))
  const wanted = (await cookies()).get("ws")?.value
  const current = list.find((w) => w.id === wanted) ?? list[0]
  return { list, current }
}

export async function isMember(userId: string, workspaceId: string) {
  await connectDb()
  return !!(await Membership.exists({ userId, workspaceId }))
}
