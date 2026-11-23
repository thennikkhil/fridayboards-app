import { redirect } from "next/navigation"
import { connectDb } from "@/lib/db"
import { Workspace } from "@/lib/models"
import { getUser } from "@/lib/session"
import { joinWorkspace } from "@/app/actions"

const OBJECT_ID = /^[0-9a-f]{24}$/

/**
 * Invite links only show a confirmation screen. The membership is created by
 * a POST (server action), so merely opening or prefetching a link never joins
 * anyone to a workspace.
 */
export default async function JoinPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>
  searchParams: Promise<{ board?: string }>
}) {
  const { code } = await params
  const { board } = await searchParams
  const safeBoard = board && OBJECT_ID.test(board) ? board : ""

  const user = await getUser()
  if (!user) {
    const here = `/join/${encodeURIComponent(code)}${safeBoard ? `?board=${safeBoard}` : ""}`
    redirect(`/auth?next=${encodeURIComponent(here)}`)
  }

  await connectDb()
  const ws = await Workspace.findOne({ inviteCode: code }).select("name").lean<{ name: string }>()
  if (!ws) redirect("/dashboard")

  async function accept() {
    "use server"
    await joinWorkspace(code, safeBoard || undefined)
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <form action={accept} style={{ maxWidth: 380, textAlign: "center", display: "grid", gap: 16 }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>Join “{ws.name}”?</h1>
        <p style={{ margin: 0, opacity: 0.7 }}>
          You&apos;ll be able to see and edit every board in this workspace.
        </p>
        <button type="submit" style={{ padding: "12px 20px", borderRadius: 10, border: 0, background: "#24231f", color: "#fff", cursor: "pointer" }}>
          Join workspace
        </button>
        <a href="/dashboard" style={{ fontSize: 14, opacity: 0.7 }}>No thanks</a>
      </form>
    </main>
  )
}
