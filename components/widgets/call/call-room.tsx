"use client";

import "@livekit/components-styles";

import {
  ConnectionStateToast,
  ControlBar,
  GridLayout,
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
} from "@livekit/components-react";
import { Track, VideoPresets, type RoomOptions } from "livekit-client";
import { useRef } from "react";
import { toast } from "sonner";

const ROOM_OPTIONS: RoomOptions = {
  adaptiveStream: true,
  dynacast: true,
  stopLocalTrackOnUnpublish: true,
  disconnectOnPageLeave: true,
  videoCaptureDefaults: { resolution: VideoPresets.h360.resolution },
};

function Tiles() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  return (
    <GridLayout tracks={tracks} className="min-h-0 flex-1">
      <ParticipantTile />
    </GridLayout>
  );
}

export function CallRoom({
  token,
  serverUrl,
  withCamera,
  onLeave,
}: {
  token: string;
  serverUrl: string;
  withCamera: boolean;
  onLeave: () => void;
}) {
  const connected = useRef(false);

  return (
    <LiveKitRoom
      data-lk-theme="default"
      className="flex h-full w-full flex-col"
      token={token}
      serverUrl={serverUrl}
      connect
      audio
      video={withCamera}
      options={ROOM_OPTIONS}
      onConnected={() => {
        connected.current = true;
      }}
      onDisconnected={onLeave}
      onError={(error) => {
        console.error("[call] error", error);
        toast.error("The call hit a problem. If it keeps happening, rejoin.");
        if (!connected.current) onLeave();
      }}
      onMediaDeviceFailure={() =>
        toast.error("Couldn't use your camera or mic. Allow access in your browser's address bar.")
      }
    >
      <Tiles />
      <ControlBar
        variation="minimal"
        controls={{
          microphone: true,
          camera: true,
          screenShare: true,
          leave: true,
          chat: false,
          settings: false,
        }}
      />
      <RoomAudioRenderer />
      <ConnectionStateToast />
    </LiveKitRoom>
  );
}
