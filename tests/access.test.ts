import { beforeEach, describe, expect, it, vi } from "vitest"

const findById = vi.fn()
const exists = vi.fn()

vi.mock("@/lib/db", () => ({ connectDb: vi.fn() }))
vi.mock("@/lib/models", () => ({
  Board: { findById: (...a: unknown[]) => ({ select: () => ({ lean: () => findById(...a) }) }) },
  Membership: { exists: (...a: unknown[]) => exists(...a) },
}))

import { assertBoardMember, BoardAccessError } from "@/lib/db/access"

describe("assertBoardMember", () => {
  beforeEach(() => vi.clearAllMocks())

  it("rejects when the board does not exist", async () => {
    findById.mockResolvedValue(null)
    await expect(assertBoardMember("u1", "b1")).rejects.toThrow(BoardAccessError)
  })

  it("rejects users who are not in the board's workspace", async () => {
    findById.mockResolvedValue({ workspaceId: "w1" })
    exists.mockResolvedValue(null)
    await expect(assertBoardMember("u1", "b1")).rejects.toThrow("Not a member")
    expect(exists).toHaveBeenCalledWith({ workspaceId: "w1", userId: "u1" })
  })

  it("allows workspace members", async () => {
    findById.mockResolvedValue({ workspaceId: "w1" })
    exists.mockResolvedValue({ _id: "m1" })
    await expect(assertBoardMember("u1", "b1")).resolves.toBeUndefined()
  })
})
