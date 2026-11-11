"use client";

import { useState, useTransition } from "react";
import { TrashIcon } from "../admin-icons";
import { deleteEvent } from "./actions";

// Suppression en deux temps, comme pour les membres.
export function DeleteEventButton({ eventId }: { eventId: string }) {
  const [armed, setArmed] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        aria-label="Delete"
        title="Delete"
        className="neu-sm neu-btn flex size-9 shrink-0 items-center justify-center rounded-full text-white/50 hover:text-red-300"
      >
        <TrashIcon />
      </button>
    );
  }

  return (
    <span className="anim-dropdown flex shrink-0 flex-col items-stretch gap-1 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={() => startTransition(() => deleteEvent(eventId))}
        disabled={pending}
        className="rounded-full bg-red-500 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-red-900/40 transition hover:bg-red-600 disabled:opacity-60"
      >
        {pending ? "Deleting..." : "Delete"}
      </button>
      <button
        type="button"
        onClick={() => setArmed(false)}
        disabled={pending}
        className="rounded-full px-3 py-2 text-xs font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
      >
        Cancel
      </button>
    </span>
  );
}
