"use client";

import Link from "next/link";
import { useTransition } from "react";
import { endMyEventAction, startMyEventAction } from "./actions";

// Les événements que j'organise (Leader / Teacher) : statut, inscrits, gains (60 % pour moi, 40 % pour l'admin),
// et les boutons du direct.

export type MyEvent = {
  id: string;
  title: string;
  status: string;
  whenLabel: string | null;
  priceLabel: string;
  registered: number;
  paidCount: number;
  live: boolean;
  ended: boolean;
  revenue: { collected: string; host: string; admin: string } | null;
};

const STATUS: Record<string, { label: string; tone: string }> = {
  pending: { label: "Waiting for the admin", tone: "bg-amber-400/15 text-amber-200" },
  published: { label: "Published", tone: "bg-emerald-400/15 text-emerald-200" },
  refused: { label: "Not approved", tone: "bg-red-500/15 text-red-200" },
};

export function MyEvents({ events }: { events: MyEvent[] }) {
  return (
    <ul className="space-y-3">
      {events.map((event) => (
        <MyEventRow key={event.id} event={event} />
      ))}
    </ul>
  );
}

function MyEventRow({ event }: { event: MyEvent }) {
  const [pending, startTransition] = useTransition();
  const status = STATUS[event.status] ?? STATUS.pending;
  return (
    <li className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
      <div className="flex flex-wrap items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-white">{event.title}</p>
          <p className="text-xs text-white/50">
            {[event.whenLabel, event.priceLabel].filter(Boolean).join(" · ")}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${status.tone}`}>{status.label}</span>
      </div>

      {event.status === "published" && (
        <>
          <p className="mt-2 text-xs text-white/60">
            {event.registered} registered
            {event.revenue ? ` · ${event.paidCount} paid` : ""}
          </p>

          {/* Mes gains : 60 % pour moi, 40 % pour l'admin */}
          {event.revenue && (
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <Money label="Collected" value={event.revenue.collected} />
              <Money label="You (60%)" value={event.revenue.host} strong />
              <Money label="Admin (40%)" value={event.revenue.admin} />
            </div>
          )}

          {/* Le direct */}
          <div className="mt-3 flex gap-2">
            {event.live ? (
              <>
                <Link
                  href={`/live/${event.id}`}
                  className="flex-1 rounded-full bg-red-500 px-4 py-2 text-center text-xs font-bold text-white shadow-lg shadow-red-900/40"
                >
                  Join the live
                </Link>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => startTransition(() => endMyEventAction(event.id))}
                  className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white/80 hover:bg-white/15 disabled:opacity-60"
                >
                  End
                </button>
              </>
            ) : !event.ended ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => startTransition(() => startMyEventAction(event.id))}
                className="flex-1 rounded-full bg-gradient-to-r from-accent to-brand px-4 py-2 text-xs font-bold text-white shadow-lg shadow-brand/30 disabled:opacity-60"
              >
                {pending ? "Starting..." : "Start the live"}
              </button>
            ) : (
              <p className="text-xs text-white/45">The live has ended.</p>
            )}
          </div>
        </>
      )}
    </li>
  );
}

function Money({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`rounded-xl px-2 py-2 ${strong ? "bg-emerald-500/15 ring-1 ring-emerald-400/30" : "bg-white/5"}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">{label}</p>
      <p className={`mt-0.5 text-sm font-bold tabular-nums ${strong ? "text-emerald-200" : "text-white"}`}>{value}</p>
    </div>
  );
}
