"use client";

import Image from "next/image";
import { ActivityIcon } from "@/components/activity-icon";
import { useState } from "react";
import { RoomTimeLeft } from "@/components/room-timer";

// La fine barre en haut de l'appel vidéo : le logo du club,
// et pour une salle de groupe : l'activité, le thème et le temps restant.
// Elle est AU-DESSUS de la vidéo (elle ne cache aucune caméra).

export type RoomInfo = {
  activityIcon: string | null;
  activityName: string | null;
  theme: string | null;
  description: string | null;
  format: string | null;
  level: string | null;
  durationMin: number | null;
  /** Fin prévue de la salle (texte ISO), pour le compte à rebours. */
  endsAt: string | null;
};

export function CallHeader({
  room,
  endsAt,
  note,
  captions,
  files,
}: {
  room?: RoomInfo;
  /** Fin de l'appel (texte ISO) : affiche le compte à rebours. */
  endsAt?: string | null;
  /** Petit texte à droite tant qu'il n'y a pas de compte à rebours. */
  note?: string | null;
  /** Le bouton CC (sous-titres en anglais). */
  captions?: { on: boolean; onToggle: () => void };
  /** L hote : le bouton des fichiers de l activite. */
  files?: { count: number; active: boolean; onOpen: () => void };
}) {
  const [showDetails, setShowDetails] = useState(false);
  const hasDetails = Boolean(room?.description || room?.format || room?.level || room?.theme);

  return (
    <header className="relative z-20 shrink-0 border-b border-white/10 bg-zinc-950/95">
      <div className="flex h-14 items-center gap-3 px-3 sm:h-16 sm:px-4">
        {/* Le logo */}
        <span className="flex shrink-0 items-center gap-2">
          <Image src="/logo.png" alt="Tomes Club" width={28} height={28} className="rounded-full" />
          <span
            className={`font-display text-sm font-bold text-white ${room ? "hidden md:inline" : ""}`}
          >
            Tomes Club
          </span>
        </span>

        {room?.activityName && (
          // L'activité et le thème, au milieu de la barre : un clic ouvre les détails
          <div className="flex min-w-0 flex-1 justify-center">
            <button
              type="button"
              onClick={() => setShowDetails((value) => !value)}
              disabled={!hasDetails}
              aria-expanded={showDetails}
              className="flex min-w-0 max-w-full items-center gap-2.5 rounded-xl px-2 py-1 text-center transition hover:bg-white/5 disabled:hover:bg-transparent"
            >
              {room.activityIcon && (
                <ActivityIcon icon={room.activityIcon} className="size-6 shrink-0 text-accent sm:size-7" />
              )}
              <span className="min-w-0">
                <span className="block truncate text-[11px] font-bold uppercase leading-tight tracking-[0.16em] text-accent sm:text-xs">
                  {room.activityName}
                </span>
                {room.theme && (
                  <span className="block truncate font-display text-[15px] font-semibold leading-snug text-white sm:text-lg">
                    {room.theme}
                  </span>
                )}
              </span>
              {hasDetails && (
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className={`size-4 shrink-0 text-white/50 transition-transform ${showDetails ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              )}
            </button>

          </>
        )}

        {/* Les fichiers de l activite (hote seulement) */}
        {files && (
          <button
            type="button"
            onClick={files.onOpen}
            title="Show a file to everyone"
            className={`ml-auto flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-extrabold ring-1 transition ${
              files.active
                ? "bg-accent text-ink ring-accent"
                : "text-white/80 ring-white/25 hover:text-white hover:ring-white/50"
            }`}
          >
            <span aria-hidden>📁</span>
            <span className="hidden sm:inline">Files</span>
            <span className="tabular-nums">{files.count}</span>
          </button>
        )}

        {/* Le temps restant, toujours à droite */}
        {captions && (
          <button
            type="button"
            onClick={captions.onToggle}
            aria-pressed={captions.on}
            title={captions.on ? "Turn English captions off" : "Turn English captions on"}
            className={`${files ? "" : "ml-auto"} shrink-0 rounded-md px-2 py-1 text-xs font-extrabold tracking-wide ring-1 transition ${
              captions.on
                ? "bg-accent text-ink ring-accent"
                : "text-white/70 ring-white/25 hover:text-white hover:ring-white/50"
            }`}
          >
            CC<span className="sr-only"> English captions</span>
          </button>
        )}

        <span className={`shrink-0 ${captions ? "" : "ml-auto"}`}>
          {endsAt ? (
            <RoomTimeLeft endsAt={endsAt} />
          ) : note ? (
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/60">{note}</span>
          ) : null}
        </span>
      </div>

      {/* Les détails, seulement si on les ouvre */}
      {room && showDetails && (
        <div className="anim-rise absolute inset-x-0 top-full border-b border-white/10 bg-zinc-950/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto max-w-3xl space-y-2 text-sm">
            {room.theme && (
              <p className="text-white">
                <span className="font-semibold text-accent">Theme: </span>
                {room.theme}
              </p>
            )}
            {room.description && (
              <p className="whitespace-pre-line text-white/75">{room.description}</p>
            )}
            <p className="text-xs text-white/55">
              {[room.format, room.level, room.durationMin ? `${room.durationMin} min` : null]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>
      )}
    </header>
  );
}
