"use client"
import { useEffect, useRef, useState } from "react"
import { nanoid } from "nanoid"
import type { WidgetProps } from "./registry"

type Result = { id: string; title: string; thumb: string; channel: string }

let apiPromise: Promise<void> | null = null
function loadApi() {
  return (apiPromise ??= new Promise<void>((resolve) => {
    const w = window as any
    if (w.YT?.Player) return resolve()
    const prev = w.onYouTubeIframeAPIReady
    w.onYouTubeIframeAPIReady = () => { prev?.(); resolve() }
    const s = document.createElement("script")
    s.src = "https://www.youtube.com/iframe_api"
    document.head.appendChild(s)
  }))
}

function parseId(text: string): string | null {
  try {
    const u = new URL(text.trim())
    if (u.hostname === "youtu.be") return u.pathname.slice(1, 12) || null
    const v = u.searchParams.get("v")
    if (v) return v
    return u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})/)?.[1] ?? null
  } catch { return null }
}

export function YouTube({ data, updateData }: WidgetProps) {
  const clientId = useRef(nanoid(8))
  const box = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const quietUntil = useRef(0)
  const dataRef = useRef(data); dataRef.current = data
  const updateRef = useRef(updateData); updateRef.current = updateData
  const [ready, setReady] = useState(false)
  const [q, setQ] = useState("")
  const [results, setResults] = useState<Result[]>([])
  const [err, setErr] = useState("")
  const [loading, setLoading] = useState(false)
  const hasVideo = !!data.videoId

  const quiet = (ms: number) => { quietUntil.current = Date.now() + ms }
  const push = (isPlaying: boolean, p: any) =>
    updateRef.current({ isPlaying, positionSec: p.getCurrentTime(), updatedAt: Date.now(), by: clientId.current })
  const onState = (e: any) => {
    if (Date.now() < quietUntil.current) return
    const p = playerRef.current ?? e.target
    if (e.data === 1) push(true, p)
    else if (e.data === 2 || e.data === 0) push(false, p)
  }

  useEffect(() => {
    if (!hasVideo) return
    let dead = false
    let player: any
    loadApi().then(() => {
      if (dead || !box.current) return
      const host = document.createElement("div")
      box.current.appendChild(host)
      player = new (window as any).YT.Player(host, {
        videoId: dataRef.current.videoId, width: "100%", height: "100%",
        playerVars: { playsinline: 1, rel: 0, origin: location.origin },
        events: { onReady: () => { if (!dead) { playerRef.current = player; setReady(true) } }, onStateChange: onState },
      })
    })
    return () => {
      dead = true; setReady(false); playerRef.current = null
      try { player?.destroy() } catch {}
      if (box.current) box.current.innerHTML = ""
    }
  }, [hasVideo])

  useEffect(() => {
    const p = playerRef.current
    if (!ready || !p || !data.videoId || data.by === clientId.current) return
    quiet(2500)
    const expected = data.isPlaying ? data.positionSec + (Date.now() - data.updatedAt) / 1000 : data.positionSec
    if (p.getVideoData?.().video_id !== data.videoId) {
      data.isPlaying ? p.loadVideoById(data.videoId, expected) : p.cueVideoById(data.videoId, expected)
      return
    }
    if (Math.abs(p.getCurrentTime() - expected) > (data.isPlaying ? 1.5 : 0.5)) p.seekTo(expected, true)
    data.isPlaying ? p.playVideo() : p.pauseVideo()
  }, [ready, data.videoId, data.isPlaying, data.positionSec, data.updatedAt, data.by])

  useEffect(() => {
    if (!ready) return
    const t = setInterval(() => {
      const p = playerRef.current, d = dataRef.current
      if (!p || Date.now() < quietUntil.current || d.isPlaying || p.getPlayerState() !== 2) return
      if (Math.abs(p.getCurrentTime() - d.positionSec) > 1) push(false, p)
    }, 1000)
    return () => clearInterval(t)
  }, [ready])

  const choose = (id: string) =>
    updateData({ videoId: id, isPlaying: false, positionSec: 0, updatedAt: Date.now(), by: clientId.current })

  const submit = async () => {
    const text = q.trim()
    if (!text) return
    setErr("")
    if (/youtu/.test(text)) {
      const id = parseId(text)
      return id ? choose(id) : setErr("Couldn't read that link")
    }
    setLoading(true)
    try {
      const r = await fetch(`/api/youtube/search?q=${encodeURIComponent(text)}`)
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || "Search failed")
      setResults(j.results)
    } catch (e: any) { setErr(e.message) }
    finally { setLoading(false) }
  }

  if (hasVideo)
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: "none", padding: "4px 8px", textAlign: "right" }}>
          <button onClick={() => updateData({ videoId: "", isPlaying: false, positionSec: 0, updatedAt: Date.now(), by: clientId.current })} style={{ border: 0, background: "transparent", cursor: "pointer", fontSize: 12 }}>
            ↩ Change video
          </button>
        </div>
        <div ref={box} style={{ flex: 1, minHeight: 0, position: "relative", background: "#000" }} />
      </div>
    )

  return (
    <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8, boxSizing: "border-box" }}>
      <div style={{ display: "flex", gap: 6 }}>
        <input
          value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Search YouTube or paste a link"
          style={{ flex: 1, minWidth: 0, padding: "6px 10px", border: "1.5px solid var(--ink, #24231f)", borderRadius: 10, background: "transparent", outline: 0 }}
        />
        <button onClick={submit} disabled={loading} style={{ padding: "6px 12px", border: "1.5px solid var(--ink, #24231f)", borderRadius: 10, background: "transparent", cursor: "pointer" }}>
          {loading ? "…" : "Go"}
        </button>
      </div>
      {err && <div style={{ fontSize: 12, color: "#c0392b" }}>{err}</div>}
      {results.map((r) => (
        <button key={r.id} onClick={() => choose(r.id)} style={{ display: "flex", gap: 8, textAlign: "left", border: 0, background: "transparent", cursor: "pointer", padding: 4, borderRadius: 8 }}>
          {r.thumb && <img src={r.thumb} alt="" width={96} height={54} style={{ borderRadius: 6, objectFit: "cover", flex: "none" }} />}
          <span style={{ fontSize: 13, lineHeight: 1.3 }}>
            <b>{r.title}</b>
            <br />
            <span style={{ opacity: 0.6 }}>{r.channel}</span>
          </span>
        </button>
      ))}
    </div>
  )
}
