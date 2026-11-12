"use client";

import { Video } from "lucide-react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import type { WidgetProps } from "@/components/widgets/registry";
import { MAX_CALL_PARTICIPANTS } from "@/lib/livekit-constants";
import { CANVAS_IGNORE_ATTR } from "@/lib/utils/widget-events";

import { useWheelIsolation } from "./use-wheel-isolation";

const CallRoom = dynamic(() => import("./call-room").then((module) => module.CallRoom), {
  ssr: false,
  loading: () => <CallStatus text="Loading call..." />,
});

type Ticket = { token: string; serverUrl: string; withCamera: boolean };

function CallStatus({ text }: { text: string }) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground" aria-busy="true">
      {text}
    </div>
  );
}

function CallWidgetEntry({ widgetId }: WidgetProps) {
  const { boardId } = useParams<{ boardId: string }>();
  const rootRef = useRef<HTMLDivElement>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [joining, setJoining] = useState(false);
  useWheelIsolation(rootRef);

  // The widget ID is shared through Liveblocks, so everyone resolves the same
  // room without needing to race or synchronize separate call state.
  const roomId = widgetId;

  const join = useCallback(
    async (withCamera: boolean) => {
      if (joining) return;
      setJoining(true);
      try {
        const response = await fetch("/api/livekit-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ boardId, roomId }),
        });
        const body = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(body?.error ?? `Request failed (${response.status}).`);
        }
        if (typeof body?.token !== "string" || typeof body?.serverUrl !== "string") {
          throw new Error("The call service returned an invalid response.");
        }
        setTicket({ token: body.token, serverUrl: body.serverUrl, withCamera });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Couldn't join the call.");
      } finally {
        setJoining(false);
      }
    },
    [boardId, joining, roomId],
  );

  return (
    <div
      ref={rootRef}
      {...{ [CANVAS_IGNORE_ATTR]: "" }}
      className="h-full w-full overflow-hidden bg-background"
    >
      {ticket ? (
        <CallRoom
          token={ticket.token}
          serverUrl={ticket.serverUrl}
          withCamera={ticket.withCamera}
          onLeave={() => setTicket(null)}
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
          <Video className="size-8 text-muted-foreground" aria-hidden />
          <div>
            <p className="font-medium">Study call</p>
            <p className="text-sm text-muted-foreground">
              This call is shared with everyone viewing this widget. Up to {MAX_CALL_PARTICIPANTS} people;
              your camera and mic stay off until you join.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              disabled={joining}
              onClick={() => void join(true)}
              className="rounded-md border px-3 py-2 text-sm font-medium disabled:cursor-wait disabled:opacity-50"
            >
              {joining ? "Joining..." : "Join with camera"}
            </button>
            <button
              type="button"
              disabled={joining}
              onClick={() => void join(false)}
              className="rounded-md border px-3 py-2 text-sm font-medium disabled:cursor-wait disabled:opacity-50"
            >
              Join without camera
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export const callWidget = {
  type: "call",
  name: "Video call",
  icon: "📹",
  defaultSize: { w: 560, h: 420 },
  minSize: { w: 320, h: 260 },
  initialData: () => ({}),
  Component: CallWidgetEntry,
};
