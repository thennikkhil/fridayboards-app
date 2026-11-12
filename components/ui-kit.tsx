"use client"
import type React from "react"
import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"

export type Page = "landing" | "auth" | "dashboard" | "create" | "board"
export type IconName = "arrow" | "board" | "check" | "chevron" | "circle" | "cursor" | "eraser" | "grid" | "home" | "image" | "layers" | "link" | "menu" | "message" | "music" | "pen" | "play" | "plus" | "search" | "share" | "shapes" | "spark" | "star" | "text" | "timer" | "undo" | "video" | "zoom"

const paths: Record<IconName, React.ReactNode> = {
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
  board: (
    <>
      <rect x="3" y="4" width="18" height="15" rx="2" />
      <path d="m7 14 3-3 3 2 4-5" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  chevron: <path d="m8 10 4 4 4-4" />,
  circle: <circle cx="12" cy="12" r="7" />,
  cursor: <path d="m5 3 14 9-6 2-2 6L5 3Z" />,
  eraser: (
    <>
      <path d="m7 18-3-3 9-10 6 6-7 7H7Z" />
      <path d="m10 8 6 6M7 18h12" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </>
  ),
  home: (
    <>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10M9 20v-6h6v6" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path d="m4 18 5-4 3 2 3-3 5 5" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
    </>
  ),
  link: (
    <>
      <path d="m10 13 4-4" />
      <path d="M8 16H6a4 4 0 0 1 0-8h3M16 8h2a4 4 0 1 1 0 8h-3" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  message: (
    <path d="M20 15a3 3 0 0 1-3 3H9l-5 3v-6a3 3 0 0 1-1-2V7a3 3 0 0 1 3-3h11a3 3 0 0 1 3 3v8Z" />
  ),
  music: (
    <>
      <path d="M9 18V6l10-2v12" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="16" cy="16" r="3" />
    </>
  ),
  pen: (
    <>
      <path d="m4 20 4-1 11-11-3-3L5 16l-1 4Z" />
      <path d="m13 8 3 3" />
    </>
  ),
  play: <path d="m9 7 9 5-9 5V7Z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m16 16 4 4" />
    </>
  ),
  share: (
    <>
      <circle cx="18" cy="5" r="2" />
      <circle cx="6" cy="12" r="2" />
      <circle cx="18" cy="19" r="2" />
      <path d="m8 11 8-5M8 13l8 5" />
    </>
  ),
  shapes: (
    <>
      <circle cx="8" cy="8" r="4" />
      <path d="m14 6 6 10H8l6-10Z" />
    </>
  ),
  spark: (
    <path d="m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z" />
  ),
  star: (
    <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />
  ),
  text: <path d="M5 5h14M12 5v14M8 19h8" />,
  timer: (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v5l3 2M9 2h6" />
    </>
  ),
  undo: <path d="M9 7 4 12l5 5M5 12h8a6 6 0 0 1 6 6" />,
  video: (
    <>
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="m16 10 5-3v10l-5-3" />
    </>
  ),
  zoom: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m16 16 4 4M8 11h6M11 8v6" />
    </>
  ),
}

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

export function Logo({ light = false }: { light?: boolean }) {
  const router = useRouter()
  const pathname = usePathname()
  const [openingHome, setOpeningHome] = useState(false)
  return (
    <button
      type="button"
      className={`logo ${light ? "text-cream" : ""}`}
      onClick={() => {
        if (openingHome || pathname === "/") return
        setOpeningHome(true)
        router.push("/")
      }}
      disabled={openingHome}
      aria-label="Go to home"
      aria-busy={openingHome}
    >
      {openingHome ? <span className="logo-spinner" aria-hidden="true" /> : <span className="logo-mark">
        <span />
      </span>}
      <span>museboard</span>
    </button>
  )
}
