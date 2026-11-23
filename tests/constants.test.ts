import { describe, expect, it } from "vitest"
import { PALETTE, colorFor } from "@/lib/colors"
import { MAX_CALL_PARTICIPANTS, ROOM_ID_REGEX, newRoomId } from "@/lib/livekit-constants"
import { MAX_PDF_BYTES } from "@/lib/pdf-constants"

describe("colorFor", () => {
  it("is deterministic and always returns a palette colour", () => {
    expect(colorFor("user-1")).toBe(colorFor("user-1"))
    expect(PALETTE).toContain(colorFor("anyone"))
  })
})

describe("call rooms", () => {
  it("generated room ids satisfy the validation regex", () => {
    expect(ROOM_ID_REGEX.test(newRoomId())).toBe(true)
  })
  it("rejects short or unsafe ids", () => {
    expect(ROOM_ID_REGEX.test("short")).toBe(false)
    expect(ROOM_ID_REGEX.test("../../etc/passwd/................")).toBe(false)
  })
  it("caps participants at 8", () => expect(MAX_CALL_PARTICIPANTS).toBe(8))
})

describe("pdf limits", () => {
  it("allows up to 16 MB", () => expect(MAX_PDF_BYTES).toBe(16 * 1024 * 1024))
})
