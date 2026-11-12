"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { registerToEvent } from "./actions";

// Le bouton "Register" d'un événement.
// Inscrit : "You are registered ✓" + un petit bouton "Cancel" pour se désinscrire.
export function RegisterButton({
  eventId,
  registered,
  locked = false,
}: {
  eventId: string;
  registered: boolean;
  /** Paiement confirmé : on ne peut plus se désinscrire seul (voir le coach). */
  locked?: boolean;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(registered);
  const [pending, startTransition] = useTransition();

  function set(on: boolean) {
    setCurrent(on);
    startTransition(async () => {
      await registerToEvent(eventId, on);
      router.refresh();
    });
  }

  if (current) {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500/20 px-4 py-3 text-sm font-bold text-emerald-200 ring-1 ring-emerald-400/40">
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
          You are registered
        </span>
        {!locked && (
          <button
            type="button"
            onClick={() => set(false)}
            disabled={pending}
            className="rounded-2xl px-3 py-3 text-xs font-semibold text-white/55 transition hover:bg-white/10 hover:text-white disabled:opacity-60"
          >
            Cancel
          </button>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => set(true)}
      disabled={pending}
      className="neu-btn flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-accent to-brand px-4 py-3 text-sm font-bold text-white shadow-lg shadow-brand/30 transition active:scale-[0.98] disabled:opacity-70"
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M19 8v6M22 11h-6" />
      </svg>
      Register
    </button>
  );
}
