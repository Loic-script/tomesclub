"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteRoomAction } from "./actions";

// Le bouton "Delete" de l hôte, en deux temps pour éviter les erreurs :
// 1er clic → "Delete this room?" ; 2e clic → la salle est fermée et supprimée.
export function DeleteRoomButton({ roomId }: { roomId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      await deleteRoomAction(roomId);
      router.refresh();
    });
  }

  if (confirming) {
    return (
      <span className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="rounded-full bg-red-600 px-3.5 py-2 text-xs font-bold text-white shadow-md transition hover:bg-red-500 disabled:opacity-60"
        >
          {pending ? "Deleting..." : "Delete"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="rounded-full px-3 py-2 text-xs font-semibold text-white/70 ring-1 ring-white/20 transition hover:text-white"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      aria-label="Delete this room"
      title="Delete this room"
      className="flex size-9 shrink-0 items-center justify-center rounded-full text-white/60 ring-1 ring-white/15 transition hover:bg-red-600/20 hover:text-red-300 hover:ring-red-400/50"
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      </svg>
    </button>
  );
}
