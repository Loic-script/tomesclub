"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { respondToEvent } from "./actions";

type Status = "going" | "interested";

// Les boutons "Going" et "Interested" d un événement (comme un "like").
// Ils sont indépendants : on peut choisir l un, l autre, ou les deux.
// Toucher un bouton déjà choisi l éteint. Le chiffre change tout de suite.
export function EventResponseButtons({
  eventId,
  mine,
  goingCount,
  interestedCount,
}: {
  eventId: string;
  mine: { going: boolean; interested: boolean };
  goingCount: number;
  interestedCount: number;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(mine);
  const [pending, startTransition] = useTransition();

  // Les chiffres affichés, avec mes choix du moment.
  const totals = { going: goingCount, interested: interestedCount };
  const count = (status: Status) =>
    totals[status] - (mine[status] ? 1 : 0) + (current[status] ? 1 : 0);

  function toggle(status: Status) {
    const on = !current[status];
    setCurrent((previous) => ({ ...previous, [status]: on }));
    startTransition(async () => {
      await respondToEvent(eventId, status, on);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => toggle("going")}
        disabled={pending}
        aria-pressed={current.going}
        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition active:scale-95 disabled:opacity-70 ${
          current.going
            ? "bg-brand text-white shadow-md ring-1 ring-accent/60"
            : "bg-white/10 text-white/85 ring-1 ring-white/15 hover:bg-white/15"
        }`}
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        </svg>
        Going
        <span className="tabular-nums opacity-80">{count("going")}</span>
      </button>

      <button
        type="button"
        onClick={() => toggle("interested")}
        disabled={pending}
        aria-pressed={current.interested}
        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition active:scale-95 disabled:opacity-70 ${
          current.interested
            ? "bg-accent text-ink shadow-md"
            : "bg-white/10 text-white/85 ring-1 ring-white/15 hover:bg-white/15"
        }`}
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="size-4"
          fill={current.interested ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={2}
          strokeLinejoin="round"
        >
          <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z" />
        </svg>
        Interested
        <span className="tabular-nums opacity-80">{count("interested")}</span>
      </button>
    </div>
  );
}
