import { AccessToken, RoomServiceClient, ServerError } from "livekit-server-sdk";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { assertBoardMember, BoardAccessError } from "@/lib/db/access";
import { MAX_CALL_PARTICIPANTS, ROOM_ID_REGEX } from "@/lib/livekit-constants";

const requestSchema = z.object({
  boardId: z.string().regex(/^[a-f\d]{24}$/i),
  roomId: z.string().regex(ROOM_ID_REGEX),
});

function fail(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

function livekitUrls() {
  const serverUrl = env("LIVEKIT_URL");
  const url = new URL(serverUrl);
  if (url.protocol !== "wss:" || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("LIVEKIT_URL must be a WebSocket Secure URL without a path.");
  }

  url.protocol = "https:";
  return { serverUrl, roomServiceUrl: url.toString() };
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return fail(401, "Sign in to join the call.");

    const parsed = requestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return fail(400, "Invalid call request.");
    const { boardId, roomId } = parsed.data;

    try {
      await assertBoardMember(session.user.id, boardId);
    } catch (error) {
      if (error instanceof BoardAccessError) {
        return fail(403, "You don't have access to this board.");
      }
      throw error;
    }

    const { serverUrl, roomServiceUrl } = livekitUrls();
    const apiKey = env("LIVEKIT_API_KEY");
    const apiSecret = env("LIVEKIT_API_SECRET");
    const roomName = `fb-${boardId}-${roomId}`;

    const rooms = new RoomServiceClient(roomServiceUrl, apiKey, apiSecret);
    try {
      await rooms.createRoom({
        name: roomName,
        maxParticipants: MAX_CALL_PARTICIPANTS,
        emptyTimeout: 300,
      });
    } catch (error) {
      // Concurrent joins can race to create the same room; only that conflict is safe to ignore.
      if (!(error instanceof ServerError) || error.code !== "already_exists") {
        throw error;
      }
    }

    const token = new AccessToken(apiKey, apiSecret, {
      identity: session.user.id,
      name: session.user.name,
      ttl: "30m",
    });
    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: false,
    });

    return Response.json({ token: await token.toJwt(), serverUrl });
  } catch (error) {
    console.error("[livekit] token failed:", error);
    return fail(500, "Couldn't start the call. Try again in a moment.");
  }
}
