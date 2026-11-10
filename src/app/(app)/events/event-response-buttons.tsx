"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { respondToEvent } from "./actions";

type Status = "going" | "interested";

// Les boutons "Going" et "Interested" d un événement (comme un "like").
// Toucher le bouton déjà choisi enlève la réponse. Le chiffre change tout de suite.
export function EventResponseButtons({
  eventId,
  mine,
  goingCount,
  interestedCount,
}: {
  eventId: string;
  mine: Status | null;
  goingCount: number;
  interestedCount: number;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState<Status | null>(mine);
  const [pending, startTransition] = useTransition();

  // Les chiffres affichés, avec ma réponse du moment.
  const base = { going: goingCount, interested: interestedCount };
  if (mine) base[mine] -= 1;
  const count = (status: Status) => base[status] + (current === status ? 1 : 0);

  function choose(status: Status) {
    const next = current === status ? null : status;
    setCurrent(next);
    startTransition(async () => {
      await respondToEvent(eventId, next);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => choose("going")}
        disabled={pending}
        aria-pressed={current === "going"}
        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition active:scale-95 disabled:opacity-70 ${
          current === "going"
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
        onClick={() => choose("interested")}
        disabled={pending}
        aria-pressed={current === "interested"}
        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition active:scale-95 disabled:opacity-70 ${
          current === "interested"
            ? "bg-accent text-ink shadow-md"
            : "bg-white/10 text-white/85 ring-1 ring-white/15 hover:bg-white/15"
        }`}
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="size-4"
          fill={current === "interested" ? "currentColor" : "none"}
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
