"use client";

import "@livekit/components-styles";
import {
  LiveKitRoom,
  useRemoteParticipants,
  useRoomContext,
  VideoConference,
} from "@livekit/components-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { CallHeader, type RoomInfo } from "@/components/call-header";
import { useNow } from "@/components/room-timer";

/** Temps laissé pour lire le message "Time is up" avant de couper. */
const ENDING_NOTICE_MS = 3000;

// L interface vidéo toute prête de LiveKit (caméras, micro, partage d écran, chat, bouton "Leave").
// Sert pour les appels privés (/call/<id>) ET les salles de groupe (/room/<id>).
// Quand le temps est fini, l appel se coupe tout seul pour tout le monde.
export function VideoRoom({
  token,
  serverUrl,
  leaveTo,
  room,
  callMinutes,
}: {
  token: string;
  serverUrl: string;
  /** Où retourner quand on quitte (ex : "/calls" ou "/rooms"). */
  leaveTo: string;
  /** Pour une salle de groupe : l activité, le thème, la fin prévue (barre du haut). */
  room?: RoomInfo;
  /** Pour un appel entre membres : sa durée, comptée quand les deux sont là. */
  callMinutes?: number;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [callEndsAt, setCallEndsAt] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);
  const showEnding = useCallback(() => setEnding(true), []);
  // Vrai seulement si on a vraiment été connecté (pour ne pas cacher une erreur de connexion).
  const wasConnected = useRef(false);

  const endsAt = room?.endsAt ?? callEndsAt;
  const note = callMinutes && !callEndsAt ? `${callMinutes}-minute call` : null;

  return (
    <>
      <CallHeader room={room} endsAt={endsAt} note={note} />

      {error && (
        <p role="alert" className="bg-red-600 px-4 py-2 text-center text-sm text-white">
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
            <p className="mt-2 font-display text-xl font-bold text-white">Time is up!</p>
            <p className="mt-1 text-sm text-white/60">Great practice. The call is ending…</p>
          </div>
        </div>
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
          // "Leave" ou fin de l appel : retour à l app. Si la connexion n a jamais marché, on reste ici.
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
        {callMinutes && !callEndsAt && (
          <CallStartWatcher minutes={callMinutes} onStart={setCallEndsAt} />
        )}
        {endsAt && <TimeKeeper endsAt={endsAt} onEnding={showEnding} />}
      </LiveKitRoom>
    </>
  );
}

/**
 * Appel entre membres : le chrono démarre quand l autre personne est là.
 * Chacun le voit au même moment (quand la deuxième personne arrive).
 */
function CallStartWatcher({
  minutes,
  onStart,
}: {
  minutes: number;
  onStart: (endsAt: string) => void;
}) {
  const remotes = useRemoteParticipants();
  const hasPartner = remotes.length > 0;

  useEffect(() => {
    if (hasPartner) onStart(new Date(Date.now() + minutes * 60 * 1000).toISOString());
  }, [hasPartner, minutes, onStart]);

  return null;
}

/** Quand l heure de fin arrive : message "Time is up", puis on coupe l appel. */
function TimeKeeper({ endsAt, onEnding }: { endsAt: string; onEnding: () => void }) {
  const room = useRoomContext();
  const now = useNow();
  const fired = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeIsUp = now !== null && now * 1000 >= new Date(endsAt).getTime();

  // On n annule la coupure que si la page se ferme (pas à chaque nouvel affichage).
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  useEffect(() => {
    if (!timeIsUp || fired.current) return;
    fired.current = true;
    onEnding();
    timer.current = setTimeout(() => {
      void room.disconnect();
    }, ENDING_NOTICE_MS);
  }, [timeIsUp, onEnding, room]);

  return null;
}
