"use client";

import { useState, useTransition } from "react";
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
        className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-semibold text-danger transition hover:bg-red-50"
      >
        Delete
      </button>
    );
  }

  return (
    <span className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => startTransition(() => deleteEvent(eventId))}
        disabled={pending}
        className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-ink transition hover:bg-red-700 disabled:opacity-60"
      >
        {pending ? "Deleting..." : "Yes, delete"}
      </button>
      <button
        type="button"
        onClick={() => setArmed(false)}
        disabled={pending}
        className="rounded-lg px-3 py-1.5 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100"
      >
        Cancel
      </button>
    </span>
  );
}
