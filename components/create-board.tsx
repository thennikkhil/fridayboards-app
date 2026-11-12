"use client"
import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createBoard } from "@/app/actions"
import { Icon, Logo, type Page } from "./ui-kit"

const templates = [
  ["Blank canvas", "A fresh page for anything", "blank"],
  ["Study session", "Notes, links & a focus timer", "study"],
  ["Project planner", "From someday to done", "project"],
  ["Moodboard", "Collect the feeling", "mood"],
  ["Mind map", "Follow every connection", "mind"],
  ["Retro playlist", "Music, memories & motion", "retro"],
]

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div
      role="alert"
      style={{
        background: "#fee2e2",
        border: "1.5px solid #fca5a5",
        borderRadius: 10,
        padding: "10px 14px",
        fontSize: 13,
        color: "#b91c1c",
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
      }}
    >
      <span style={{ fontSize: 16 }}>⚠</span>
      {message}
      <button
        onClick={onDismiss}
        style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#b91c1c", fontSize: 16 }}
        aria-label="Dismiss"
      >×</button>
    </div>
  )
}

export function CreateBoard({ go }: { go: (page: Page) => void }) {
  const router = useRouter()
  const [busy, start] = useTransition()
  const [selected, setSelected] = useState("Blank canvas")
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [openingDashboard, setOpeningDashboard] = useState(false)

  useEffect(() => {
    if (!error) return
    const timer = setTimeout(() => setError(""), 3000)
    return () => clearTimeout(timer)
  }, [error])

  const create = () => {
    setError("")
    start(async () => {
      try {
        const id = await createBoard({ title: name, template: selected })
        router.push(`/board/${id}`)
      } catch {
        setError("Couldn't create the board. Please try again.")
      }
    })
  }

  return (
    <div className="create-page">
      <header>
        <Logo />
        <button
          onClick={() => {
            setOpeningDashboard(true)
            go("dashboard")
          }}
          disabled={openingDashboard}
        >
          {openingDashboard ? "Opening dashboard…" : <>Close <span>×</span></>}
        </button>
      </header>
      <main>
        <div className="create-heading">
          <span className="kicker">A NEW BEGINNING</span>
          <h1>
            What are we
            <br />
            <em>making today?</em>
          </h1>
          <p>Pick a starting point. You can change everything later.</p>
        </div>
        <div className="create-layout">
          <section className="template-picker">
            <h3>Choose a template</h3>
            <div className="creation-grid">
              {templates.map(([title, desc, kind]) => (
                <button
                  key={title}
                  className={`creation-card ${selected === title ? "selected" : ""}`}
                  onClick={() => setSelected(title)}
                  disabled={busy}
                >
                  <div className={`creation-preview ${kind}`}>
                    {kind === "blank" && <span className="blank-face">·ᴗ·</span>}
                    {kind === "study" && (<><i /><i /><b>A+</b></>)}
                    {kind === "project" && (<><span /><span /><span /></>)}
                    {kind === "mood" && (<><i /><i /><i /></>)}
                    {kind === "mind" && (<><b /><span /><span /><span /></>)}
                    {kind === "retro" && (
                      <>
                        <div className="cassette">MIX<br />01</div>
                        <div className="retro-lines">▂▅▇▃▆</div>
                      </>
                    )}
                    {selected === title && (
                      <div className="selected-check">
                        <Icon name="check" size={14} />
                      </div>
                    )}
                  </div>
                  <b>{title}</b>
                  <small>{desc}</small>
                </button>
              ))}
            </div>
          </section>
          <aside className="setup-card">
            <span>ALMOST THERE</span>
            <h2>Name your board</h2>
            {error && <ErrorBanner message={error} onDismiss={() => setError("")} />}
            <label>
              BOARD NAME
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Untitled masterpiece"
                onKeyDown={(e) => e.key === "Enter" && create()}
                disabled={busy}
              />
            </label>
            <label>
              WORKSPACE ACCESS
              <div className="select-like" role="note">
                <span>
                  <Icon name="link" size={18} /> Invite workspace members to join
                </span>
              </div>
            </label>
            <button
              className="coral-btn"
              disabled={busy}
              onClick={create}
              style={{ opacity: busy ? 0.7 : 1, cursor: busy ? "not-allowed" : "pointer" }}
            >
              {busy ? (
                <>
                  Creating your canvas…
                  <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin .7s linear infinite", marginLeft: 8 }} />
                </>
              ) : (
                <>Open the canvas <Icon name="arrow" /></>
              )}
            </button>
            <p>You can invite your crew once you're inside.</p>
          </aside>
        </div>
      </main>
    </div>
  )
}
