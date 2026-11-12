import "server-only";

import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { FileModel } from "@/lib/models/file";
import { deleteObjects } from "@/lib/r2";

export function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

export async function getUserId(request: Request): Promise<string | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user.id ?? null;
}

export async function deleteBoardFiles(boardId: string) {
  await connectDb();
  const files = await FileModel.find({ boardId }).select("key").lean<{ key: string }[]>();
  if (files.length > 0) await deleteObjects(files.map((file) => file.key));
  await FileModel.deleteMany({ boardId });
}
