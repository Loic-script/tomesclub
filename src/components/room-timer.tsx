"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";

// Le temps d une salle : compte à rebours en direct (chaque seconde).
// L heure vient du navigateur ; côté serveur on affiche "--:--".

function subscribeEverySecond(onTick: () => void) {
  const timer = setInterval(onTick, 1000);
  return () => clearInterval(timer);
}

/** L heure actuelle en secondes (null côté serveur). */
export function useNow(): number | null {
  return useSyncExternalStore(
    subscribeEverySecond,
    () => Math.floor(Date.now() / 1000),
    () => null,
  );
}

/** Secondes restantes avant la fin (peut être négatif), ou null côté serveur. */
function useSecondsLeft(endsAt: string): number | null {
  const now = useNow();
  return now === null ? null : Math.floor(new Date(endsAt).getTime() / 1000) - now;
}

function format(left: number): string {
  const minutes = Math.floor(left / 60);
  return `${minutes}:${String(left % 60).padStart(2, "0")}`;
}

/** La pastille "12:34 left", puis "Time is up". */
export function RoomTimeLeft({
  endsAt,
  className = "",
  refreshOnEnd = false,
}: {
  endsAt: string;
  className?: string;
  /** Recharger la page à la fin (la liste des salles retire alors la salle finie). */
  refreshOnEnd?: boolean;
}) {
  const left = useSecondsLeft(endsAt);
  const router = useRouter();
  const refreshed = useRef(false);
  const ended = left !== null && left <= 0;

  useEffect(() => {
    if (!refreshOnEnd || !ended || refreshed.current) return;
    refreshed.current = true;
    router.refresh();
  }, [refreshOnEnd, ended, router]);

  if (left !== null && left <= 0) {
    return (
      <span
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/60 ${className}`}
      >
        <ClockIcon />
        Time is up
      </span>
    );
  }

  const lastMinute = left !== null && left <= 60;
  return (
    <span
      role="timer"
      aria-label={left === null ? "Time left" : `${format(left)} left`}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tabular-nums ${
        lastMinute ? "bg-accent/20 text-accent" : "bg-white/10 text-white/85"
      } ${className}`}
    >
      <ClockIcon />
      {left === null ? "--:--" : format(left)}
      <span className="font-normal text-white/55">left</span>
    </span>
  );
}

/** Une fine barre qui se vide avec le temps. */
export function RoomProgress({ endsAt, durationMin }: { endsAt: string; durationMin: number }) {
  const left = useSecondsLeft(endsAt);
  const total = durationMin * 60;
  const ratio = left === null ? 1 : Math.min(1, Math.max(0, left / total));
  return (
    <div aria-hidden className="h-1 w-full overflow-hidden bg-white/10">
      <div
        className={`h-full rounded-r-full transition-[width] duration-1000 ease-linear ${
          ratio < 0.15 ? "bg-accent" : "bg-gradient-to-r from-accent to-brand"
        }`}
        style={{ width: `${ratio * 100}%` }}
      />
    </div>
  );
}

function ClockIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
