"use client";

import { useState, useTransition } from "react";
import { deleteMember } from "./actions";

// Suppression en deux temps : un clic arme le bouton, un deuxième confirme.
// (Pas de fenêtre "confirm" du navigateur : plus clair et plus joli.)
export function DeleteMemberButton({ userId, name }: { userId: string; name: string }) {
  const [armed, setArmed] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
      >
        Delete
      </button>
    );
  }

  return (
    <span className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => startTransition(() => deleteMember(userId))}
        disabled={pending}
        className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
      >
        {pending ? "Deleting..." : `Yes, delete ${name}`}
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
