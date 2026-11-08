import { connectDb } from "@/lib/db"
import { Board, Favorite } from "@/lib/models"
import { getWorkspaces, requireUser } from "@/lib/session"
import { Dashboard } from "@/components/dashboard"

export const dynamic = "force-dynamic"
const kinds = ["bio", "brand", "film", "thesis"]

function ago(d: Date) {
  const m = Math.round((Date.now() - +d) / 60000)
  if (m < 1) return "Edited just now"
  if (m < 60) return `Edited ${m} min ago`
  if (m < 1440) return `Edited ${Math.round(m / 60)} h ago`
  return `Edited ${Math.round(m / 1440)} d ago`
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view = "home" } = await searchParams
  const user = await requireUser()
  const { list, current } = await getWorkspaces(user)
  await connectDb()
  const [boards, favs] = await Promise.all([
    Board.find({ workspaceId: current.id }).sort({ updatedAt: -1 }).lean<any[]>(),
    Favorite.find({ userId: user.id }).lean<any[]>(),
  ])
  const favSet = new Set(favs.map((f) => f.boardId))
  const cards = boards
    .filter((b) => (view === "mine" ? b.ownerId === user.id : view === "shared" ? b.ownerId !== user.id : view === "favorites" ? favSet.has(String(b._id)) : true))
    .map((b) => {
      const id = String(b._id)
      return {
        id, title: b.title, meta: ago(b.updatedAt), favorite: favSet.has(id),
        kind: kinds[parseInt(id.slice(-2), 16) % 4],
        people: b.ownerId === user.id ? [user.name[0].toUpperCase()] : [],
      }
    })
  const dateLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }).replace(",", ",").toUpperCase()
  return (
    <Dashboard
      data={{ user: { id: user.id, name: user.name }, workspaces: list, current, boards: cards, view, dateLabel }}
    />
  )
}
