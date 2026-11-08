"use client"
import { useState, useTransition } from "react"
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

export function CreateBoard({ go }: { go: (page: Page) => void }) {
  const router = useRouter()
  const [busy, start] = useTransition()
  const [selected, setSelected] = useState("Blank canvas")
  const [name, setName] = useState("")
  return (
    <div className="create-page">
      <header>
        <Logo />
        <button onClick={() => go("dashboard")}>
          Close <span>×</span>
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
                  className={`creation-card ${
                    selected === title ? "selected" : ""
                  }`}
                  onClick={() => setSelected(title)}
                >
                  <div className={`creation-preview ${kind}`}>
                    {kind === "blank" && (
                      <span className="blank-face">·ᴗ·</span>
                    )}
                    {kind === "study" && (
                      <>
                        <i />
                        <i />
                        <b>A+</b>
                      </>
                    )}
                    {kind === "project" && (
                      <>
                        <span />
                        <span />
                        <span />
                      </>
                    )}
                    {kind === "mood" && (
                      <>
                        <i />
                        <i />
                        <i />
                      </>
                    )}
                    {kind === "mind" && (
                      <>
                        <b />
                        <span />
                        <span />
                        <span />
                      </>
                    )}
                    {kind === "retro" && (
                      <>
                        <div className="cassette">
                          MIX
                          <br />
                          01
                        </div>
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
            <label>
              BOARD NAME
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Untitled masterpiece"
              />
            </label>
            <label>
              WHO CAN JOIN?
              <button className="select-like">
                <span>
                  <Icon name="link" size={18} /> Anyone with the link
                </span>
                <Icon name="chevron" size={17} />
              </button>
            </label>
            <button className="coral-btn" disabled={busy} onClick={() => start(async () => router.push(`/board/${await createBoard({ title: name, template: selected })}`))}>
              Open the canvas <Icon name="arrow" />
            </button>
            <p>You can invite your crew once you're inside.</p>
          </aside>
        </div>
      </main>
    </div>
  )
}

