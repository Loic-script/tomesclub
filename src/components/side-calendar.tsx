"use client";

import Link from "next/link";
import { useState, useSyncExternalStore, type CSSProperties } from "react";

// Le calendrier du panneau de gauche : mois navigable, "aujourd'hui" en bordeaux.
// La date vient du navigateur (rien côté serveur).

/** Préviens React chaque minute (assez pour changer de jour à minuit). */
function subscribeEveryMinute(onTick: () => void) {
  const timer = setInterval(onTick, 60 * 1000);
  return () => clearInterval(timer);
}

/** Un événement à marquer dans le calendrier (date en texte ISO). */
export type CalendarEvent = { id: string; startsAt: string; title: string };

const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

export function SideCalendar({
  className = "",
  events = [],
}: {
  className?: string;
  /** Les jours avec un événement sont en orange et mènent à l'événement. */
  events?: CalendarEvent[];
}) {
  const tick = useSyncExternalStore(
    subscribeEveryMinute,
    () => Math.floor(Date.now() / 60000),
    () => 0,
  );
  // Le mois affiché : null = celui d'aujourd'hui ; sinon choisi avec les flèches.
  const [view, setView] = useState<{ year: number; month: number } | null>(null);

  if (tick === 0) return null;
  const today = new Date(tick * 60000);
  const shown = view ?? { year: today.getFullYear(), month: today.getMonth() };

  const firstDay = new Date(shown.year, shown.month, 1);
  const daysInMonth = new Date(shown.year, shown.month + 1, 0).getDate();
  // Lundi = 0 ... Dimanche = 6
  const offset = (firstDay.getDay() + 6) % 7;

  const monthLabel = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(firstDay);

  // Le premier événement de chaque jour (heure locale du membre).
  const eventByDay = new Map<string, CalendarEvent>();
  for (const event of events) {
    const key = dayKey(new Date(event.startsAt));
    if (!eventByDay.has(key)) eventByDay.set(key, event);
  }

  const isToday = (day: number) =>
    today.getDate() === day &&
    today.getMonth() === shown.month &&
    today.getFullYear() === shown.year;

  function move(step: number) {
    const next = new Date(shown.year, shown.month + step, 1);
    setView({ year: next.getFullYear(), month: next.getMonth() });
  }

  return (
    <aside aria-label="Calendar" className={className}>
      <div
        className="neu anim-rise w-72 rounded-[2rem] p-6"
        style={{ "--d": "300ms" } as CSSProperties}
      >
        {/* En-tête : mois + flèches */}
        <div className="mb-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => move(-1)}
            aria-label="Previous month"
            className="neu-sm neu-btn flex size-8 items-center justify-center rounded-full text-white/70 hover:text-accent"
          >
            <Chevron direction="left" />
          </button>
          <p className="font-display text-base font-bold text-white">{monthLabel}</p>
          <button
            type="button"
            onClick={() => move(1)}
            aria-label="Next month"
            className="neu-sm neu-btn flex size-8 items-center justify-center rounded-full text-white/70 hover:text-accent"
          >
            <Chevron direction="right" />
          </button>
        </div>

        {/* Jours de la semaine */}
        <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-semibold uppercase text-white/45">
          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        {/* Les jours du mois */}
        <div className="grid grid-cols-7 gap-y-1 text-center">
          {Array.from({ length: offset }, (_, index) => (
            <span key={`empty-${index}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, index) => {
            const day = index + 1;
            const event = eventByDay.get(dayKey(new Date(shown.year, shown.month, day)));
            const base = "mx-auto flex size-8 items-center justify-center rounded-full text-sm transition-colors";

            // Un jour avec un événement : orange, et un clic ouvre l'événement.
            if (event) {
              return (
                <Link
                  key={day}
                  href={`/events?event=${event.id}`}
                  title={event.title}
                  aria-label={`${day}: ${event.title}`}
                  className={`${base} font-bold ${
                    isToday(day)
                      ? "bg-brand text-white ring-2 ring-accent"
                      : "bg-accent text-ink shadow-md hover:scale-110 hover:bg-accent/90"
                  }`}
                >
                  {day}
                </Link>
              );
            }

            return (
              <span
                key={day}
                className={`${base} ${
                  isToday(day)
                    ? "bg-brand font-bold text-white shadow-md ring-1 ring-white/30"
                    : "font-medium text-white/80 hover:bg-white/10"
                }`}
              >
                {day}
              </span>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`size-4 ${direction === "left" ? "" : "rotate-180"}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m14 6-6 6 6 6" />
    </svg>
  );
}
