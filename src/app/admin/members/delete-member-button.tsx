"use client";

import { useState, useTransition } from "react";
import { TrashIcon } from "../admin-icons";
import { deleteMember } from "./actions";

// Suppression en deux temps : un clic arme le bouton, un deuxième confirme.
// `compact` : une simple icône poubelle (dans la liste).
export function DeleteMemberButton({
  userId,
  name,
  compact = false,
}: {
  userId: string;
  name: string;
  compact?: boolean;
}) {
  const [armed, setArmed] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!armed) {
    return compact ? (
      <button
        type="button"
        onClick={() => setArmed(true)}
        aria-label={`Delete ${name}`}
        title="Delete member"
        className="neu-sm neu-btn flex size-9 items-center justify-center rounded-full text-white/50 hover:text-red-300"
      >
        <TrashIcon />
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setArmed(true)}
        className="flex items-center gap-2 rounded-full border border-red-400/40 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/15"
      >
        <TrashIcon />
        Delete member
      </button>
    );
  }

  return (
    <span className="anim-dropdown flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => startTransition(() => deleteMember(userId))}
        disabled={pending}
        className="rounded-full bg-red-500 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-red-900/40 transition hover:bg-red-600 disabled:opacity-60"
      >
        {pending ? "Deleting..." : compact ? "Delete" : `Yes, delete ${name}`}
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
