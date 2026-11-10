"use client";

import { useState, useSyncExternalStore } from "react";
import { ChevronIcon } from "@/components/icons";

// Le calendrier : mois navigable, "aujourd'hui" en bordeaux,
// et un petit point sous les jours où un cours est prévu.
// La date vient du navigateur (l'heure locale du membre).

/** Préviens React chaque minute (assez pour changer de jour à minuit). */
function subscribeEveryMinute(onTick: () => void) {
  const timer = setInterval(onTick, 60 * 1000);
  return () => clearInterval(timer);
}

const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

export function SideCalendar({
  className = "",
  eventDates = [],
}: {
  className?: string;
  /** Les dates des cours (texte ISO), pour les marquer d'un point. */
  eventDates?: string[];
}) {
  const tick = useSyncExternalStore(
    subscribeEveryMinute,
    () => Math.floor(Date.now() / 60000),
    () => 0,
  );
  // Le mois affiché : null = celui d'aujourd'hui ; sinon choisi avec les flèches.
  const [view, setView] = useState<{ year: number; month: number } | null>(null);

  // Côté serveur, on ne connaît pas la date du membre : une forme vide de même taille.
  if (tick === 0) {
    return <div aria-hidden className={`card h-80 animate-pulse ${className}`} />;
  }

  const today = new Date(tick * 60000);
  const shown = view ?? { year: today.getFullYear(), month: today.getMonth() };
  const marked = new Set(eventDates.map((iso) => dayKey(new Date(iso))));

  const firstDay = new Date(shown.year, shown.month, 1);
  const daysInMonth = new Date(shown.year, shown.month + 1, 0).getDate();
  // Lundi = 0 ... Dimanche = 6
  const offset = (firstDay.getDay() + 6) % 7;

  const monthLabel = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(
    firstDay,
  );
  const isCurrentMonth =
    shown.year === today.getFullYear() && shown.month === today.getMonth();

  function move(step: number) {
    const next = new Date(shown.year, shown.month + step, 1);
    setView({ year: next.getFullYear(), month: next.getMonth() });
  }

  return (
    <section aria-label="Calendar" className={`card p-5 ${className}`}>
      {/* En-tête : mois + flèches */}
      <div className="mb-4 flex items-center gap-1">
        <p aria-live="polite" className="flex-1 font-display text-base font-semibold text-ink">
          {monthLabel}
        </p>
        {!isCurrentMonth && (
          <button type="button" onClick={() => setView(null)} className="btn btn-ghost btn-sm">
            Today
          </button>
        )}
        <button
          type="button"
          onClick={() => move(-1)}
          aria-label="Previous month"
          className="btn btn-ghost btn-sm btn-icon w-8"
        >
          <ChevronIcon direction="left" />
        </button>
        <button
          type="button"
          onClick={() => move(1)}
          aria-label="Next month"
          className="btn btn-ghost btn-sm btn-icon w-8"
        >
          <ChevronIcon />
        </button>
      </div>

      {/* Jours de la semaine */}
      <div aria-hidden className="mb-1 grid grid-cols-7 text-center text-xs font-medium text-mute">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
          <span key={day} className="py-1">
            {day}
          </span>
        ))}
      </div>

      {/* Les jours du mois */}
      <div className="grid grid-cols-7 gap-y-0.5 text-center">
        {Array.from({ length: offset }, (_, index) => (
          <span key={`empty-${index}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = index + 1;
          const date = new Date(shown.year, shown.month, day);
          const isToday = dayKey(date) === dayKey(today);
          const hasClass = marked.has(dayKey(date));
          return (
            <span
              key={day}
              aria-current={isToday ? "date" : undefined}
              className={`relative mx-auto flex size-9 items-center justify-center rounded-full text-sm tabular-nums ${
                isToday
                  ? "bg-brand font-semibold text-white"
                  : hasClass
                    ? "font-semibold text-brand"
                    : "text-ink/80"
              }`}
            >
              {day}
              {hasClass && (
                <>
                  <span
                    aria-hidden
                    className={`absolute bottom-1 size-1 rounded-full ${isToday ? "bg-white" : "bg-brand"}`}
                  />
                  <span className="sr-only">, class scheduled</span>
                </>
              )}
            </span>
          );
        })}
      </div>

      {eventDates.length > 0 && (
        <p className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-xs text-mute">
          <span aria-hidden className="size-1.5 rounded-full bg-brand" />
          A class is scheduled on this day
        </p>
      )}
    </section>
  );
}
