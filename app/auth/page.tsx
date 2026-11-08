"use client"
import { useRouter } from "next/navigation"
import { Auth } from "@/components/auth"
export default function AuthPage() {
  const router = useRouter()
  return <Auth go={() => router.push("/")} />
}
