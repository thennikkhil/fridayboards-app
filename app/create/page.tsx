"use client"
import { useRouter } from "next/navigation"
import { CreateBoard } from "@/components/create-board"
export default function CreatePage() {
  const router = useRouter()
  return <CreateBoard go={() => router.push("/dashboard")} />
}
