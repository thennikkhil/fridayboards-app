import { Schema, model, models } from "mongoose";

const fileSchema = new Schema(
  {
    boardId: { type: String, required: true, index: true },
    uploaderId: { type: String, required: true },
    key: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    status: { type: String, enum: ["pending", "ready"], default: "pending", index: true },
    pageCount: { type: Number },
  },
  { timestamps: true },
);

export const FileModel = models.UploadedFile || model("UploadedFile", fileSchema, "files");
