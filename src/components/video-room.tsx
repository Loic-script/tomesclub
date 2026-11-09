"use client";

import "@livekit/components-styles";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

// L'interface vidéo toute prête de LiveKit (caméras, micro, partage d'écran, chat, bouton "Leave").
// Sert pour les appels privés (/call/<id>) ET les salles de groupe (/room/<id>).
export function VideoRoom({
  token,
  serverUrl,
  leaveTo,
}: {
  token: string;
  serverUrl: string;
  /** Où retourner quand on quitte (ex : "/calls" ou "/rooms"). */
  leaveTo: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  // Vrai seulement si on a vraiment été connecté (pour ne pas cacher une erreur de connexion).
  const wasConnected = useRef(false);

  return (
    <>
      {error && (
        <p role="alert" className="bg-red-600 px-4 py-2 text-center text-sm text-white">
          {error}{" "}
          <Link href={leaveTo} className="font-semibold underline">
            Back
          </Link>
        </p>
      )}

      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect
        video
        audio
        data-lk-theme="default"
        className="min-h-0 flex-1"
        onConnected={() => {
          wasConnected.current = true;
        }}
        onDisconnected={() => {
          // "Leave" ou fin de l'appel : retour à l'app. Si la connexion n'a jamais marché, on reste ici.
          if (wasConnected.current) router.push(leaveTo);
        }}
        onError={(err) => {
          console.error("[VideoRoom]", err);
          setError("Could not connect to the video server.");
        }}
        onMediaDeviceFailure={() =>
          setError("Camera or microphone not available. Check your browser permissions.")
        }
      >
        <VideoConference />
      </LiveKitRoom>
    </>
  );
}
