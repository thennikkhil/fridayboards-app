"use client"
import { useRouter } from "next/navigation"
import { Landing } from "@/components/landing"
import type { Page } from "@/components/ui-kit"

export default function Home() {
  const router = useRouter()
  const routes: Record<Page, string> = { landing: "/", auth: "/auth", dashboard: "/dashboard", create: "/create", board: "/dashboard" }
  return <Landing go={(p) => router.push(routes[p])} />
}
