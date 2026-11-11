"use client";

import "@livekit/components-styles";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import { Room, RoomEvent } from "livekit-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CallHeader, type RoomInfo } from "@/components/call-header";
import { CaptionsOverlay, useLiveCaptions } from "@/components/live-captions";
import { useNow } from "@/components/room-timer";

/** Temps laissé pour lire le message "Time is up" avant de couper. */
const ENDING_NOTICE_MS = 3000;

// L interface vidéo toute prête de LiveKit (caméras, micro, partage d écran, chat, bouton "Leave").
// Sert pour les appels privés (/call/<id>) ET les salles de groupe (/room/<id>).
// Quand le temps est fini : message "Time is up", le serveur ferme la salle
// (tout le monde sort), et chacun revient à la page d avant.
export function VideoRoom({
  token,
  serverUrl,
  leaveTo,
  room,
  callMinutes,
  onTimeUp,
}: {
  token: string;
  serverUrl: string;
  /** Où retourner quand on quitte (ex : "/calls" ou "/rooms"). */
  leaveTo: string;
  /** Pour une salle de groupe : l activité, le thème, la fin prévue (barre du haut). */
  room?: RoomInfo;
  /** Pour un appel entre membres : sa durée, comptée quand les deux sont là. */
  callMinutes?: number;
  /** Action serveur appelée à la fin du temps (ferme la salle pour tout le monde). */
  onTimeUp?: () => Promise<void>;
}) {
  const router = useRouter();
  // Notre propre connexion LiveKit : on peut la couper nous-mêmes à la fin du temps.
  const [liveRoom] = useState(() => new Room());
  const [error, setError] = useState<string | null>(null);
  const [callEndsAt, setCallEndsAt] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);
  // Vrai seulement si on a vraiment été connecté (pour ne pas cacher une erreur de connexion).
  const wasConnected = useRef(false);

  // Les sous-titres en anglais (bouton CC dans la barre du haut).
  const captions = useLiveCaptions(liveRoom);

  const endsAt = room?.endsAt ?? callEndsAt;
  const note = callMinutes && !callEndsAt ? `${callMinutes}-minute call` : null;

  // Appel entre membres : le chrono démarre quand l autre personne arrive.
  useEffect(() => {
    if (!callMinutes || callEndsAt) return;
    const start = () => {
      if (liveRoom.remoteParticipants.size > 0) {
        setCallEndsAt(
          new Date(Date.now() + callMinutes * 60 * 1000).toISOString(),
        );
      }
    };
    liveRoom.on(RoomEvent.ParticipantConnected, start);
    liveRoom.on(RoomEvent.Connected, start);
    return () => {
      liveRoom.off(RoomEvent.ParticipantConnected, start);
      liveRoom.off(RoomEvent.Connected, start);
    };
  }, [liveRoom, callMinutes, callEndsAt]);

  // La fin du temps : message, fermeture côté serveur, puis on coupe chez nous.
  const now = useNow();
  const timeIsUp =
    endsAt !== null && now !== null && now * 1000 >= new Date(endsAt).getTime();
  const fired = useRef(false);
  useEffect(() => {
    if (!timeIsUp || fired.current) return;
    fired.current = true;
    setEnding(true);
    onTimeUp?.().catch((err) => console.error("[VideoRoom] onTimeUp", err));
    // Pas de nettoyage ici : la coupure doit avoir lieu même si l écran se redessine.
    setTimeout(() => {
      if (wasConnected.current) {
        void liveRoom.disconnect();
      } else {
        router.push(leaveTo);
      }
    }, ENDING_NOTICE_MS);
  }, [timeIsUp, onTimeUp, liveRoom, router, leaveTo]);

  return (
    <>
      <CallHeader
        room={room}
        endsAt={endsAt}
        note={note}
        captions={{ on: captions.on, onToggle: captions.toggle }}
      />

      {error && (
        <p
          role="alert"
          className="bg-red-600 px-4 py-2 text-center text-sm text-white"
        >
          {error}{" "}
          <Link href={leaveTo} className="font-semibold underline">
            Back
          </Link>
        </p>
      )}

      {/* Le message de fin, juste avant de couper */}
      {ending && (
        <div
          role="status"
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-6 backdrop-blur-sm"
        >
          <div className="anim-rise rounded-3xl bg-zinc-900 px-8 py-6 text-center ring-1 ring-white/10">
            <p className="text-3xl" aria-hidden>
              ⏰
            </p>
            <p className="mt-2 font-display text-xl font-bold text-white">
              Time is up!
            </p>
            <p className="mt-1 text-sm text-white/60">
              Great practice. The call is ending…
            </p>
          </div>
        </div>
      )}

      {/* La vidéo, avec les sous-titres posés en bas */}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <LiveKitRoom
          room={liveRoom}
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
            // "Leave", fin du temps, ou salle fermée par le serveur : retour à l app.
            // Si la connexion n a jamais marché, on reste ici pour voir l erreur.
            if (wasConnected.current) router.push(leaveTo);
          }}
          onError={(err) => {
            console.error("[VideoRoom]", err);
            setError("Could not connect to the video server.");
          }}
          onMediaDeviceFailure={() =>
            setError(
              "Camera or microphone not available. Check your browser permissions.",
            )
          }
        >
          <VideoConference />
        </LiveKitRoom>
        {captions.on && (
          <CaptionsOverlay lines={captions.lines} notice={captions.notice} />
        )}
      </div>
    </>
  );
}
