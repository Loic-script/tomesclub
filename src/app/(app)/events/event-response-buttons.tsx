"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { registerToEvent } from "./actions";

// Le bouton "Register" d'un événement.
// Inscrit : une carte "You are registered" + (événement payant) le statut du paiement.
export function RegisterButton({
  eventId,
  registered,
  locked = false,
  payment = null,
}: {
  eventId: string;
  registered: boolean;
  /** Paiement confirmé : on ne peut plus se désinscrire seul (voir l'admin). */
  locked?: boolean;
  /** Événement payant : le prix ("10 000 Ar") et si l'admin a confirmé le paiement. */
  payment?: { label: string; paid: boolean } | null;
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
      <div className="overflow-hidden rounded-2xl bg-white/[0.06] ring-1 ring-white/10">
        {/* Inscrit */}
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-900/40">
            <svg aria-hidden viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="m5 12.5 4.5 4.5L19 7.5" />
            </svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-white">You are registered</span>
            <span className="block text-xs text-white/50">See you at the event!</span>
          </span>
          {!locked && (
            <button
              type="button"
              onClick={() => set(false)}
              disabled={pending}
              className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-white/45 transition hover:bg-white/10 hover:text-white disabled:opacity-60"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Événement payant : où en est le paiement */}
        {payment && (
          <div
            className={`flex items-center gap-3 border-t px-4 py-2.5 ${
              payment.paid ? "border-emerald-400/20 bg-emerald-500/10" : "border-amber-300/15 bg-amber-400/[0.07]"
            }`}
          >
            <span className="relative flex size-2.5 shrink-0">
              {!payment.paid && <span className="anim-ping absolute inset-0 rounded-full bg-amber-300" />}
              <span className={`relative size-2.5 rounded-full ${payment.paid ? "bg-emerald-400" : "bg-amber-300"}`} />
            </span>
            <span className="min-w-0 flex-1 text-xs">
              <span className={`font-semibold ${payment.paid ? "text-emerald-200" : "text-amber-200"}`}>
                {payment.paid ? "Payment confirmed" : "Payment pending"}
              </span>
              <span className="text-white/45">
                {payment.paid ? " · thank you!" : " · the admin will confirm it soon"}
              </span>
            </span>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${
                payment.paid ? "bg-emerald-500/20 text-emerald-200" : "bg-amber-400/15 text-amber-200"
              }`}
            >
              {payment.label}
            </span>
          </div>
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
      <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M19 8v6M22 11h-6" />
      </svg>
      Register
      {payment && <span className="rounded-full bg-black/20 px-2 py-0.5 text-xs tabular-nums">{payment.label}</span>}
    </button>
  );
}
