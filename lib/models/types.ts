/** Shapes of lean() documents, so callers don't need `any`. */
export type BoardDoc = { _id: unknown; workspaceId: string; ownerId: string; title: string; template: string }
export type MembershipDoc = { workspaceId: string; userId: string; role: "owner" | "member" }
export type WorkspaceDoc = { _id: unknown; name: string; ownerId: string; inviteCode: string }
