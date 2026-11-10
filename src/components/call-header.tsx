"use client";

import Image from "next/image";
import { useState, useSyncExternalStore } from "react";

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

/** L'heure du navigateur, mise à jour chaque seconde (null côté serveur). */
function subscribeEverySecond(onTick: () => void) {
  const timer = setInterval(onTick, 1000);
  return () => clearInterval(timer);
}

function useNow(): number | null {
  return useSyncExternalStore(
    subscribeEverySecond,
    () => Math.floor(Date.now() / 1000),
    () => null,
  );
}

export function CallHeader({ room }: { room?: RoomInfo }) {
  const [showDetails, setShowDetails] = useState(false);
  const hasDetails = Boolean(room?.description || room?.format || room?.level || room?.theme);

  return (
    <header className="relative z-20 shrink-0 border-b border-white/10 bg-zinc-950/95">
      <div className="flex h-12 items-center gap-3 px-3 sm:px-4">
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
          <>
            <span aria-hidden className="hidden h-5 w-px bg-white/15 md:block" />

            {/* L'activité et le thème : un clic ouvre les détails */}
            <button
              type="button"
              onClick={() => setShowDetails((value) => !value)}
              disabled={!hasDetails}
              aria-expanded={showDetails}
              className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-1 text-left transition hover:bg-white/5 disabled:hover:bg-transparent"
            >
              <span aria-hidden className="text-lg leading-none">
                {room.activityIcon}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[11px] font-semibold uppercase leading-tight tracking-wide text-accent">
                  {room.activityName}
                </span>
                {room.theme && (
                  <span className="block truncate text-sm leading-tight text-white/90">
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

            {room.endsAt && <Countdown endsAt={room.endsAt} />}
          </>
        )}
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

/** Le temps restant : "12:34 left", puis "Time's up". */
function Countdown({ endsAt }: { endsAt: string }) {
  const now = useNow();
  if (now === null) {
    return (
      <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs text-white/60">--:--</span>
    );
  }

  const left = Math.floor(new Date(endsAt).getTime() / 1000) - now;
  if (left <= 0) {
    return (
      <span className="shrink-0 rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold text-accent">
        Time&apos;s up
      </span>
    );
  }

  const minutes = Math.floor(left / 60);
  const seconds = String(left % 60).padStart(2, "0");
  const lastMinute = left <= 60;
  return (
    <span
      role="timer"
      aria-label={`${minutes} minutes ${seconds} seconds left`}
      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold tabular-nums ${
        lastMinute ? "bg-accent/20 text-accent" : "bg-white/10 text-white/85"
      }`}
    >
      {minutes}:{seconds}
      <span className="hidden sm:inline"> left</span>
    </span>
  );
}
