import mongoose, { Schema, models, model } from "mongoose"

const opts = { timestamps: true }

const workspaceSchema = new Schema(
  { name: { type: String, required: true }, ownerId: { type: String, required: true }, inviteCode: { type: String, required: true, unique: true } },
  opts,
)
const membershipSchema = new Schema(
  { workspaceId: { type: String, required: true }, userId: { type: String, required: true, index: true }, role: { type: String, enum: ["owner", "member"], default: "member" } },
  opts,
)
membershipSchema.index({ workspaceId: 1, userId: 1 }, { unique: true })

const boardSchema = new Schema(
  { workspaceId: { type: String, required: true }, title: { type: String, required: true }, ownerId: { type: String, required: true }, template: { type: String, default: "Blank canvas" } },
  opts,
)
boardSchema.index({ workspaceId: 1, updatedAt: -1 })
boardSchema.index({ title: "text" })

const favoriteSchema = new Schema({ userId: { type: String, required: true }, boardId: { type: String, required: true } }, opts)
favoriteSchema.index({ userId: 1, boardId: 1 }, { unique: true })

export const Workspace = (models.Workspace as mongoose.Model<any>) || model("Workspace", workspaceSchema)
export const Membership = (models.Membership as mongoose.Model<any>) || model("Membership", membershipSchema)
export const Board = (models.Board as mongoose.Model<any>) || model("Board", boardSchema)
export const Favorite = (models.Favorite as mongoose.Model<any>) || model("Favorite", favoriteSchema)
export { FileModel } from "./file"

const ytCacheSchema = new Schema(
  { query: { type: String, required: true, unique: true }, results: { type: Array, default: [] }, expiresAt: { type: Date, required: true } },
  opts,
)
ytCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
export const YtCache = (models.YtCache as mongoose.Model<any>) || model("YtCache", ytCacheSchema)
