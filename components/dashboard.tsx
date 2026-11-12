"use client"
import { useState, useTransition, useEffect, useRef } from "react"
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
  navigate,
  active = "home",
  data,
  onError,
}: {
  go: (page: Page) => void
  navigate: (path: string) => void
  active?: string
  data: DashData
  onError: (msg: string) => void
}) {
  const router = useRouter()
  const [isPending, start] = useTransition()
  const view = (v: string) => navigate(v === "home" ? "/dashboard" : `/dashboard?view=${v}`)
  const dots = ["coral", "blue", "yellow"]

  // New workspace inline form
  const [newSpaceOpen, setNewSpaceOpen] = useState(false)
  const [newSpaceName, setNewSpaceName] = useState("")
  const [spaceBusy, setSpaceBusy] = useState(false)
  const spaceInputRef = useRef<HTMLInputElement>(null)

  // Logout confirm state
  const [logoutConfirm, setLogoutConfirm] = useState(false)
  const [logoutBusy, setLogoutBusy] = useState(false)

  useEffect(() => {
    if (newSpaceOpen) spaceInputRef.current?.focus()
  }, [newSpaceOpen])

  const submitNewSpace = async () => {
    const name = newSpaceName.trim()
    if (!name) return
    setSpaceBusy(true)
    try {
      await createWorkspace(name)
      router.refresh()
      setNewSpaceOpen(false)
      setNewSpaceName("")
    } catch {
      onError("Failed to create workspace")
    } finally {
      setSpaceBusy(false)
    }
  }

  const handleLogout = async () => {
    setLogoutBusy(true)
    try {
      await authClient.signOut()
      location.href = "/"
    } catch {
      onError("Sign-out failed")
      setLogoutBusy(false)
      setLogoutConfirm(false)
    }
  }

  return (
    <aside className="sidebar">
      <Logo />
      <button className="new-board" onClick={() => go("create")}>
        <Icon name="plus" size={18} /> New board
      </button>
      <nav aria-label="Board views">
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
            setNewSpaceOpen((o) => !o)
            setNewSpaceName("")
          }}
          aria-label="New space"
        >
          <Icon name="plus" size={15} />
        </button>
      </div>
      {newSpaceOpen && (
        <div className="new-space-form">
          <input
            ref={spaceInputRef}
            value={newSpaceName}
            onChange={(e) => setNewSpaceName(e.target.value)}
            placeholder="Space name…"
            disabled={spaceBusy}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitNewSpace()
              if (e.key === "Escape") { setNewSpaceOpen(false); setNewSpaceName("") }
            }}
          />
          <button onClick={submitNewSpace} disabled={spaceBusy || !newSpaceName.trim()}>
            {spaceBusy ? "…" : "Add"}
          </button>
          <button onClick={() => { setNewSpaceOpen(false); setNewSpaceName("") }}>✕</button>
        </div>
      )}
      <nav>
        {data.workspaces.map((w, i) => (
          <button
            key={w.id}
            className={w.id === data.current.id ? "active" : ""}
            onClick={() => start(async () => {
              try {
                await switchWorkspace(w.id)
                navigate("/dashboard")
              } catch {
                onError("Couldn't switch workspaces. Please try again.")
              }
            })}
            disabled={isPending}
          >
            <span className={`space-dot ${dots[i % 3]}`} /> {isPending ? "Switching…" : w.name}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="user">
          <span className="av a1">{data.user.name[0]?.toUpperCase()}</span>
          <div>
            <b>{data.user.name}</b>
            <small>Free plan</small>
          </div>
          {logoutConfirm ? (
            <div className="logout-confirm">
              <span>Sign out?</span>
              <button onClick={handleLogout} disabled={logoutBusy} style={{ color: "var(--red, #e55)" }}>
                {logoutBusy ? "…" : "Yes"}
              </button>
              <button onClick={() => setLogoutConfirm(false)}>No</button>
            </div>
          ) : (
            <button onClick={() => setLogoutConfirm(true)}>•••</button>
          )}
        </div>
      </div>
    </aside>
  )
}

export function Dashboard({ data }: { data: DashData }) {
  const router = useRouter()
  const [isPending, start] = useTransition()
  const navigate = (path: string) => start(() => router.push(path))
  const go = (p: Page) => navigate(p === "create" ? "/create" : p === "landing" ? "/" : "/dashboard")

  // Board opening loading state
  const [openingBoard, setOpeningBoard] = useState<string | null>(null)
  const open = (id: string) => {
    setOpeningBoard(id)
    navigate(`/board/${id}`)
  }

  // Template creation loading state
  const [makingTemplate, setMakingTemplate] = useState<string | null>(null)
  const make = (template: string) => {
    setMakingTemplate(template)
    start(async () => {
      try {
        const id = await createBoard({ template })
        open(id)
      } catch {
        setError("Failed to create board")
        setMakingTemplate(null)
      }
    })
  }

  // Card context menu state
  const [cardMenuOpen, setCardMenuOpen] = useState<string | null>(null)
  const [renameId, setRenameId] = useState<string | null>(null)
  const [renameVal, setRenameVal] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [actionBusy, setActionBusy] = useState(false)

  // Error banner
  const [error, setError] = useState("")
  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(""), 3000)
    return () => clearTimeout(t)
  }, [error])

  // Close menu on outside click
  const menuRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!cardMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setCardMenuOpen(null)
        setRenameId(null)
        setDeleteId(null)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [cardMenuOpen])

  const handleFavorite = async (b: BoardCard) => {
    setActionBusy(true)
    try { await toggleFavorite(b.id); router.refresh() }
    catch { setError("Failed to update favourite") }
    finally { setActionBusy(false); setCardMenuOpen(null) }
  }

  const handleRenameSubmit = async (boardId: string) => {
    const name = renameVal.trim()
    if (!name) return
    setActionBusy(true)
    try { await renameBoard(boardId, name); router.refresh() }
    catch { setError("Failed to rename board") }
    finally { setActionBusy(false); setCardMenuOpen(null); setRenameId(null) }
  }

  const handleDelete = async (boardId: string) => {
    setActionBusy(true)
    try { await deleteBoard(boardId); router.refresh() }
    catch { setError("Failed to delete board") }
    finally { setActionBusy(false); setCardMenuOpen(null); setDeleteId(null) }
  }

  const [query, setQuery] = useState("")
  const [listView, setListView] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const boards = data.boards.filter((b) =>
    b.title.toLowerCase().includes(query.toLowerCase()),
  )
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <div className="app-shell">
      <Sidebar go={go} navigate={navigate} active={data.view} data={data} onError={setError} />
      <main className="workspace">
        {isPending && (
          <div className="route-progress" role="status" aria-live="polite">
            <span className="route-spinner" aria-hidden="true" />
            Opening your workspace…
          </div>
        )}
        {error && (
          <div
            className="error-banner"
            role="alert"
            style={{
              position: "fixed",
              top: 16,
              left: "50%",
              transform: "translateX(-50%)",
              background: "var(--red, #e55)",
              color: "#fff",
              padding: "8px 20px",
              borderRadius: 8,
              zIndex: 9999,
              display: "flex",
              gap: 12,
              alignItems: "center",
            }}
          >
            {error}
            <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontWeight: 700 }}>✕</button>
          </div>
        )}
        <header className="workspace-top">
          <div className="search">
            <Icon name="search" size={18} />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your boards..."
            />
            <kbd>⌘ K</kbd>
          </div>
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
            <p>You don't need to have it all figured out.</p>
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
            <button
              className="template-card blank"
              onClick={() => make("Blank canvas")}
              disabled={makingTemplate === "Blank canvas" || isPending}
            >
              <div>
                {makingTemplate === "Blank canvas" ? <span style={{ fontSize: 20 }}>…</span> : <Icon name="plus" size={29} />}
              </div>
              <b>Blank board</b>
              <small>Start from scratch</small>
            </button>
            <button
              className="template-card brain"
              onClick={() => make("Brainstorm")}
              disabled={makingTemplate === "Brainstorm" || isPending}
            >
              <div>
                {makingTemplate === "Brainstorm" ? <span style={{ fontSize: 20 }}>…</span> : <><span>IDEA</span><i>WHY?</i><b>→</b></>}
              </div>
              <b>Brainstorm</b>
              <small>Let it all out</small>
            </button>
            <button
              className="template-card notes"
              onClick={() => make("Study session")}
              disabled={makingTemplate === "Study session" || isPending}
            >
              <div>
                {makingTemplate === "Study session" ? <span style={{ fontSize: 20 }}>…</span> : <><i /><i /><i /><i /></>}
              </div>
              <b>Study notes</b>
              <small>Learn it your way</small>
            </button>
            <button
              className="template-card map"
              onClick={() => make("Mind map")}
              disabled={makingTemplate === "Mind map" || isPending}
            >
              <div>
                {makingTemplate === "Mind map" ? <span style={{ fontSize: 20 }}>…</span> : <><span>goal</span><span>next</span><span>idea</span></>}
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
              <button
                type="button"
                className={!listView ? "active" : ""}
                aria-label="Grid view"
                aria-pressed={!listView}
                onClick={() => setListView(false)}
              >
                <Icon name="grid" size={18} />
              </button>
              <button
                type="button"
                className={listView ? "active" : ""}
                aria-label="List view"
                aria-pressed={listView}
                onClick={() => setListView(true)}
              >
                <Icon name="menu" size={18} />
              </button>
            </div>
          </div>
          <div className={`boards-grid${listView ? " list" : ""}`}>
            {boards.map((board) => (
              <div key={board.id} style={{ position: "relative" }}>
                <button
                  className={`board-card${openingBoard === board.id ? " opening" : ""}`}
                  onClick={() => open(board.id)}
                  disabled={openingBoard === board.id}
                  style={{ opacity: openingBoard === board.id ? 0.6 : 1, transition: "opacity .2s" }}
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
                    {openingBoard === board.id && (
                      <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>⏳</span>
                    )}
                    <span
                      className="card-menu"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (cardMenuOpen === board.id) {
                          setCardMenuOpen(null)
                          setRenameId(null)
                          setDeleteId(null)
                        } else {
                          setCardMenuOpen(board.id)
                          setRenameId(null)
                          setRenameVal(board.title)
                          setDeleteId(null)
                        }
                      }}
                    >
                      {board.favorite ? "★ " : ""}•••
                    </span>
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

                {/* Card context menu dropdown */}
                {cardMenuOpen === board.id && (
                  <div
                    ref={menuRef}
                    className="card-dropdown"
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      zIndex: 100,
                      background: "var(--surface, #fff)",
                      border: "1px solid var(--border, #e0e0e0)",
                      borderRadius: 10,
                      boxShadow: "0 4px 20px rgba(0,0,0,.12)",
                      minWidth: 180,
                      padding: "6px 0",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Favourite */}
                    <button
                      disabled={actionBusy}
                      onClick={() => handleFavorite(board)}
                      style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 16px", background: "none", border: "none", cursor: "pointer" }}
                    >
                      ⭐ {board.favorite ? "Unfavourite" : "Favourite"}
                    </button>

                    {/* Rename */}
                    {renameId === board.id ? (
                      <div style={{ padding: "6px 12px", display: "flex", gap: 6 }}>
                        <input
                          autoFocus
                          value={renameVal}
                          onChange={(e) => setRenameVal(e.target.value)}
                          disabled={actionBusy}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRenameSubmit(board.id)
                            if (e.key === "Escape") setRenameId(null)
                          }}
                          style={{ flex: 1, fontSize: 13, padding: "4px 6px", borderRadius: 6, border: "1px solid var(--border, #ccc)" }}
                        />
                        <button
                          onClick={() => handleRenameSubmit(board.id)}
                          disabled={actionBusy || !renameVal.trim()}
                          style={{ fontSize: 13, padding: "4px 8px", borderRadius: 6, background: "var(--accent, #6c63ff)", color: "#fff", border: "none", cursor: "pointer" }}
                        >
                          {actionBusy ? "…" : "OK"}
                        </button>
                      </div>
                    ) : (
                      <button
                        disabled={actionBusy}
                        onClick={() => { setRenameId(board.id); setRenameVal(board.title) }}
                        style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 16px", background: "none", border: "none", cursor: "pointer" }}
                      >
                        ✏️ Rename
                      </button>
                    )}

                    {/* Delete */}
                    {deleteId === board.id ? (
                      <div style={{ padding: "6px 12px" }}>
                        <p style={{ margin: "0 0 6px", fontSize: 13, color: "var(--red, #e55)" }}>Delete for everyone?</p>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => handleDelete(board.id)}
                            disabled={actionBusy}
                            style={{ flex: 1, fontSize: 13, padding: "4px 8px", borderRadius: 6, background: "var(--red, #e55)", color: "#fff", border: "none", cursor: "pointer" }}
                          >
                            {actionBusy ? "…" : "Confirm"}
                          </button>
                          <button
                            onClick={() => setDeleteId(null)}
                            style={{ flex: 1, fontSize: 13, padding: "4px 8px", borderRadius: 6, background: "none", border: "1px solid var(--border, #ccc)", cursor: "pointer" }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        disabled={actionBusy}
                        onClick={() => setDeleteId(board.id)}
                        style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 16px", background: "none", border: "none", cursor: "pointer", color: "var(--red, #e55)" }}
                      >
                        🗑 Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
