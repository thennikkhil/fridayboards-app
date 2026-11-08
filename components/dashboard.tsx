"use client"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { createBoard, createWorkspace, deleteBoard, renameBoard, switchWorkspace, toggleFavorite } from "@/app/actions"
import { Icon, Logo, type Page } from "./ui-kit"

export type BoardCard = { id: string; title: string; meta: string; kind: string; people: string[]; favorite: boolean }
export type DashData = {
  user: { id: string; name: string }
  workspaces: { id: string; name: string }[]
  current: { id: string; name: string }
  boards: BoardCard[]
  view: string
  dateLabel: string
}

function Sidebar({
  go,
  active = "home",
  data,
}: {
  go: (page: Page) => void
  active?: string
  data: DashData
}) {
  const router = useRouter()
  const [, start] = useTransition()
  const view = (v: string) => router.push(v === "home" ? "/dashboard" : `/dashboard?view=${v}`)
  const dots = ["coral", "blue", "yellow"]
  return (
    <aside className="sidebar">
      <Logo />
      <button className="new-board" onClick={() => go("create")}>
        <Icon name="plus" size={18} /> New board
      </button>
      <nav>
        <button
          className={active === "home" ? "active" : ""}
          onClick={() => view("home")}
        >
          <Icon name="home" />
          Home
        </button>
        <button className={active === "mine" ? "active" : ""} onClick={() => view("mine")}>
          <Icon name="board" />
          My boards
        </button>
        <button className={active === "shared" ? "active" : ""} onClick={() => view("shared")}>
          <Icon name="share" />
          Shared with me
        </button>
        <button className={active === "favorites" ? "active" : ""} onClick={() => view("favorites")}>
          <Icon name="star" />
          Favorites
        </button>
      </nav>
      <div className="sidebar-label">
        SPACES{" "}
        <button
          onClick={() => {
            const name = prompt("Name your new space")
            if (name) start(async () => { await createWorkspace(name); router.refresh() })
          }}
        >
          <Icon name="plus" size={15} />
        </button>
      </div>
      <nav>
        {data.workspaces.map((w, i) => (
          <button
            key={w.id}
            className={w.id === data.current.id ? "active" : ""}
            onClick={() => start(async () => { await switchWorkspace(w.id); router.push("/dashboard") })}
          >
            <span className={`space-dot ${dots[i % 3]}`} /> {w.name}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <button>
          <Icon name="timer" />
          Focus timer <span className="new-pill">NEW</span>
        </button>
        <div className="user">
          <span className="av a1">{data.user.name[0]?.toUpperCase()}</span>
          <div>
            <b>{data.user.name}</b>
            <small>Free plan</small>
          </div>
          <button onClick={async () => { if (confirm("Log out?")) { await authClient.signOut(); location.href = "/" } }}>•••</button>
        </div>
      </div>
    </aside>
  )
}

export function Dashboard({ data }: { data: DashData }) {
  const router = useRouter()
  const go = (p: Page) => router.push(p === "create" ? "/create" : p === "landing" ? "/" : "/dashboard")
  const [, start] = useTransition()
  const open = (id: string) => router.push(`/board/${id}`)
  const make = (template: string) =>
    start(async () => open(await createBoard({ template })))
  const cardMenu = (e: React.MouseEvent, b: BoardCard) => {
    e.stopPropagation()
    const a = prompt(`"${b.title}" — type: star, rename or delete`)?.trim().toLowerCase()
    start(async () => {
      if (a === "star") await toggleFavorite(b.id)
      else if (a === "rename") { const t = prompt("New name", b.title); if (t) await renameBoard(b.id, t) }
      else if (a === "delete" && confirm("Delete this board for everyone?")) await deleteBoard(b.id)
      router.refresh()
    })
  }
  const [query, setQuery] = useState("")
  const boards = data.boards.filter((b) =>
    b.title.toLowerCase().includes(query.toLowerCase()),
  )
  return (
    <div className="app-shell">
      <Sidebar go={go} active={data.view} data={data} />
      <main className="workspace">
        <header className="workspace-top">
          <div className="search">
            <Icon name="search" size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your boards..."
            />
            <kbd>⌘ K</kbd>
          </div>
          <button className="round-btn">
            <Icon name="message" size={19} />
            <i />
          </button>
          <button className="round-btn">
            <Icon name="timer" size={19} />
          </button>
        </header>
        <section className="welcome-row">
          <div>
            <span className="kicker">{data.dateLabel}</span>
            <h1>
              Morning, {data.user.name.split(" ")[0]} <span className="tiny-sun">✦</span>
            </h1>
            <p>What are we making sense of today?</p>
          </div>
          <div className="daily-note">
            <b>tiny reminder</b>
            <p>You don’t need to have it all figured out.</p>
            <span>— your board</span>
          </div>
        </section>
        <section className="quick-start">
          <div className="row-heading">
            <h2>Start something</h2>
            <button onClick={() => go("create")}>
              Browse all templates <Icon name="arrow" size={15} />
            </button>
          </div>
          <div className="template-row">
            <button className="template-card blank" onClick={() => make("Blank canvas")}>
              <div>
                <Icon name="plus" size={29} />
              </div>
              <b>Blank board</b>
              <small>Start from scratch</small>
            </button>
            <button className="template-card brain" onClick={() => make("Brainstorm")}>
              <div>
                <span>IDEA</span>
                <i>WHY?</i>
                <b>→</b>
              </div>
              <b>Brainstorm</b>
              <small>Let it all out</small>
            </button>
            <button className="template-card notes" onClick={() => make("Study session")}>
              <div>
                <i />
                <i />
                <i />
                <i />
              </div>
              <b>Study notes</b>
              <small>Learn it your way</small>
            </button>
            <button className="template-card map" onClick={() => make("Mind map")}>
              <div>
                <span>goal</span>
                <span>next</span>
                <span>idea</span>
              </div>
              <b>Mind map</b>
              <small>Connect the dots</small>
            </button>
          </div>
        </section>
        <section className="recent">
          <div className="row-heading">
            <h2>{{ home: "Recent boards", mine: "My boards", shared: "Shared with me", favorites: "Favorites" }[data.view] ?? "Recent boards"}</h2>
            <div className="view-btns">
              <button className="active">
                <Icon name="grid" size={18} />
              </button>
              <button>
                <Icon name="menu" size={18} />
              </button>
            </div>
          </div>
          <div className="boards-grid">
            {boards.map((board) => (
              <button
                className="board-card"
                key={board.id}
                onClick={() => open(board.id)}
              >
                <div className={`board-thumb ${board.kind}`}>
                  {board.kind === "bio" && (
                    <>
                      <span className="cell c1" />
                      <span className="cell c2" />
                      <b>
                        CELL
                        <br />
                        DIVISION
                      </b>
                      <i>mitosis →</i>
                    </>
                  )}
                  {board.kind === "brand" && (
                    <>
                      <span className="swatch s1" />
                      <span className="swatch s2" />
                      <span className="swatch s3" />
                      <em>
                        soft / bold
                        <br />
                        human
                      </em>
                    </>
                  )}
                  {board.kind === "film" && (
                    <>
                      <div className="filmstrip">◼ ◼ ◼</div>
                      <b>
                        SPRING
                        <br />
                        WATCHLIST
                      </b>
                      <i>★★★★★</i>
                    </>
                  )}
                  {board.kind === "thesis" && (
                    <>
                      <span>question</span>
                      <span>research</span>
                      <span>outline</span>
                      <svg viewBox="0 0 200 80">
                        <path d="M20 60c50-70 90 50 160-20" />
                      </svg>
                    </>
                  )}
                  <span className="card-menu" onClick={(e) => cardMenu(e, board)}>{board.favorite ? "★ " : ""}•••</span>
                </div>
                <div className="board-info">
                  <div>
                    <b>{board.title}</b>
                    <small>{board.meta}</small>
                  </div>
                  <div className="mini-avatars">
                    {board.people.map((p, i) => (
                      <i className={`av a${i + 1}`} key={i}>
                        {p}
                      </i>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

