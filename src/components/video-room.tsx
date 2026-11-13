"use client";

import "@livekit/components-styles";
import {
  LiveKitRoom,
  VideoConference,
  useRoomContext,
} from "@livekit/components-react";
import "flag-icons/css/flag-icons.min.css";
import { Room, RoomEvent } from "livekit-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CallHeader, type RoomInfo } from "@/components/call-header";
import { CaptionsOverlay, useLiveCaptions } from "@/components/live-captions";
import { useNow } from "@/components/room-timer";
import { FilesDrawer, StageView, useStage } from "@/components/stage";
import type { ActivityFileView } from "@/lib/file-kinds";

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
  stage: stageConfig,
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
  /** Salle de groupe : les fichiers de l activite (l hote les montre, les autres regardent). */
  stage?: {
    isHost: boolean;
    files: ActivityFileView[];
    activityName: string | null;
  };
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

  // La scene : un fichier montre a tout le monde (l hote controle).
  const isHost = stageConfig?.isHost ?? false;
  const stage = useStage(liveRoom, isHost);
  const [filesOpen, setFilesOpen] = useState(false);
  const showing = stage.state !== null;

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

  // Les autres personnes présentes (seul dans la salle → on peut partir).
  const [othersHere, setOthersHere] = useState(0);
  useEffect(() => {
    const count = () => setOthersHere(liveRoom.remoteParticipants.size);
    liveRoom.on(RoomEvent.ParticipantConnected, count);
    liveRoom.on(RoomEvent.ParticipantDisconnected, count);
    liveRoom.on(RoomEvent.Connected, count);
    return () => {
      liveRoom.off(RoomEvent.ParticipantConnected, count);
      liveRoom.off(RoomEvent.ParticipantDisconnected, count);
      liveRoom.off(RoomEvent.Connected, count);
    };
  }, [liveRoom]);

  // Règle du club : on reste jusqu'à la fin du temps (le bouton Leave revient à la fin).
  const leaveLocked = endsAt !== null && !timeIsUp && othersHere > 0;

  // Fermer l'onglet pendant ce temps : le navigateur demande d'abord.
  useEffect(() => {
    if (!leaveLocked) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [leaveLocked]);
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
        files={
          isHost && stageConfig
            ? {
                count: stageConfig.files.length,
                active: showing,
                onOpen: () => setFilesOpen(true),
              }
            : undefined
        }
      />

      {filesOpen && stageConfig && (
        <FilesDrawer
          files={stageConfig.files}
          activityName={stageConfig.activityName}
          currentId={stage.state?.file.id ?? null}
          onClose={() => setFilesOpen(false)}
          onPick={(file) => {
            stage.show(file);
            setFilesOpen(false);
          }}
        />
      )}

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

      {leaveLocked && (
        <p className="flex items-center justify-center gap-1.5 bg-white/[0.04] px-4 py-1.5 text-center text-[11px] font-medium text-white/60">
          <span aria-hidden>🔒</span>
          Stay until the end: you can leave when the time is up.
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

      {/* La vidéo, avec les sous-titres posés en bas.
          Un fichier montré : il prend la grande place, les caméras passent sur le côté (ou en bas). */}
      <div className="relative flex min-h-0 flex-1 flex-col lg:flex-row">
        {showing && (
          <StageView
            stage={stage}
            isHost={isHost}
            onOpenFiles={() => setFilesOpen(true)}
          />
        )}
        <div
          className={`${leaveLocked ? "leave-locked " : ""}${
            showing
              ? "flex h-[38%] shrink-0 flex-col border-t border-white/10 lg:h-auto lg:w-[360px] lg:border-l lg:border-t-0"
              : "flex min-h-0 flex-1 flex-col"
          }`}
        >
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
            <ParticipantFlags />
          </LiveKitRoom>
        </div>
        {captions.on && (
          <CaptionsOverlay lines={captions.lines} notice={captions.notice} />
        )}
      </div>
    </>
  );
}

/**
 * Le drapeau du pays de chaque personne, posé devant son nom sur sa vidéo.
 * Le pays vient des métadonnées du ticket d'entrée ({"country":"MG"}).
 * (Le composant vidéo de LiveKit affiche le nom tout seul : on ajoute le drapeau à côté.)
 */
function ParticipantFlags() {
  const room = useRoomContext();
  useEffect(() => {
    const countryOf = (name: string): string | null => {
      const people = [
        room.localParticipant,
        ...room.remoteParticipants.values(),
      ];
      const person = people.find(
        (participant) => (participant.name || participant.identity) === name,
      );
      try {
        const code = (
          JSON.parse(person?.metadata || "{}") as { country?: string | null }
        ).country;
        return code && /^[A-Z]{2}$/.test(code) ? code.toLowerCase() : null;
      } catch {
        return null;
      }
    };
    const paint = () => {
      for (const label of document.querySelectorAll<HTMLElement>(
        "[data-lk-participant-name]",
      )) {
        const code = countryOf(label.dataset.lkParticipantName ?? "");
        const existing = label.previousElementSibling as HTMLElement | null;
        const hasFlag = existing?.dataset.tcFlag !== undefined;
        if (!code) {
          if (hasFlag) existing?.remove();
          continue;
        }
        if (hasFlag && existing?.dataset.tcFlag === code) continue;
        if (hasFlag) existing?.remove();
        const flag = document.createElement("span");
        flag.dataset.tcFlag = code;
        flag.className = `fi fi-${code}`;
        flag.style.cssText =
          "width:1.1em;height:0.82em;margin-right:0.35em;border-radius:2px;background-size:cover;flex-shrink:0;vertical-align:-0.1em;";
        label.before(flag);
      }
    };
    paint();
    const observer = new MutationObserver(paint);
    observer.observe(document.body, { childList: true, subtree: true });
    room.on(RoomEvent.ParticipantConnected, paint);
    room.on(RoomEvent.ParticipantMetadataChanged, paint);
    return () => {
      observer.disconnect();
      room.off(RoomEvent.ParticipantConnected, paint);
      room.off(RoomEvent.ParticipantMetadataChanged, paint);
    };
  }, [room]);
  return null;
}
