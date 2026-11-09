import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getUser } from "@/lib/session"
import { connectDb } from "@/lib/db"
import { YtCache } from "@/lib/models"

const hits = new Map<string, number[]>()
function limited(uid: string) {
  const now = Date.now()
  const arr = (hits.get(uid) ?? []).filter((t) => now - t < 60_000)
  arr.push(now)
  hits.set(uid, arr)
  return arr.length > 8
}
const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">")

export async function GET(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = z.string().trim().min(1).max(100).safeParse(req.nextUrl.searchParams.get("q"))
  if (!parsed.success) return NextResponse.json({ error: "Type something to search" }, { status: 400 })
  const query = parsed.data.toLowerCase()

  await connectDb()
  const cached = await YtCache.findOne({ query, expiresAt: { $gt: new Date() } }).lean<any>()
  if (cached) return NextResponse.json({ results: cached.results })

  if (limited(user.id)) return NextResponse.json({ error: "Slow down — try again in a minute" }, { status: 429 })
  const key = process.env.YOUTUBE_API_KEY
  if (!key) return NextResponse.json({ error: "YouTube search isn't configured" }, { status: 500 })

  const url = new URL("https://www.googleapis.com/youtube/v3/search")
  url.search = new URLSearchParams({ part: "snippet", type: "video", videoEmbeddable: "true", maxResults: "8", q: query, key }).toString()
  const r = await fetch(url)
  if (!r.ok)
    return NextResponse.json(
      { error: r.status === 403 ? "Search quota reached for today — paste a YouTube link instead." : "YouTube search failed" },
      { status: r.status === 403 ? 429 : 502 },
    )
  const j = await r.json()
  const results = (j.items ?? []).map((i: any) => ({
    id: i.id.videoId as string,
    title: decode(i.snippet.title),
    channel: decode(i.snippet.channelTitle),
    thumb: i.snippet.thumbnails?.medium?.url ?? "",
  }))
  await YtCache.updateOne({ query }, { query, results, expiresAt: new Date(Date.now() + 24 * 3600_000) }, { upsert: true })
  return NextResponse.json({ results })
}
