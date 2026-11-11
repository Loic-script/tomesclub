"use client";

import { useState, useTransition } from "react";
import { adminCloseRoomAction } from "./actions";

// Fermer une salle pour tout le monde, en deux clics (pour éviter les erreurs).
export function CloseRoomButton({ roomId }: { roomId: string }) {
  const [armed, setArmed] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        className="neu-sm neu-btn rounded-full px-4 py-2 text-xs font-bold text-white/70 hover:text-red-300"
      >
        Close
      </button>
    );
  }
  return (
    <span className="anim-dropdown flex items-center gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => adminCloseRoomAction(roomId))}
        className="rounded-full bg-red-500 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-red-900/40 disabled:opacity-60"
      >
        {pending ? "Closing..." : "Close for all"}
      </button>
      <button
        type="button"
        onClick={() => setArmed(false)}
        className="rounded-full px-2.5 py-2 text-xs font-semibold text-white/60 hover:text-white"
      >
        Cancel
      </button>
    </span>
  );
}
