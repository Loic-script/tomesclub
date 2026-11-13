"use client";

import { useState, useTransition } from "react";
import { removeParticipantAction } from "@/app/room/moderation-actions";

// Le bouton "People" de l'hôte (Leader / Teacher) ou de l'admin : la liste des participants,
// avec "Remove" (il peut revenir) et "Ban" (il ne peut plus revenir).

export type ModerationConfig = {
  kind: "room" | "event";
  id: string;
  hostId: string | null;
};

export function ModerationPanel({
  config,
  people,
}: {
  config: ModerationConfig;
  people: { identity: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [armed, setArmed] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const list = people.filter((person) => person.identity !== "coach");

  function act(identity: string, ban: boolean) {
    startTransition(async () => {
      const result = await removeParticipantAction(
        config.kind,
        config.id,
        identity,
        ban,
      );
      setArmed(null);
      setMessage(
        result.ok
          ? ban
            ? "Banned: this person can't come back."
            : "Removed from the call."
          : result.error,
      );
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15"
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="9" cy="8" r="3.2" />
          <path d="M2.8 19a6.2 6.2 0 0 1 12.4 0" />
          <circle cx="17" cy="9.5" r="2.4" />
          <path d="M15.6 14.5a4.9 4.9 0 0 1 5.6 4.5" />
        </svg>
        People
        <span className="rounded-full bg-white/15 px-1.5 text-[10px] tabular-nums">
          {list.length}
        </span>
      </button>

      {open && (
        <div className="fixed right-3 top-28 z-40 w-[min(20rem,calc(100vw-1.5rem))] rounded-3xl bg-zinc-900/95 p-3 shadow-2xl ring-1 ring-white/10 backdrop-blur">
          <div className="mb-2 flex items-center px-1">
            <p className="flex-1 text-sm font-bold text-white">
              People in the call
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="flex size-7 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
            >
              ×
            </button>
          </div>
          {list.length === 0 ? (
            <p className="px-1 py-4 text-center text-xs text-white/50">
              Nobody else is here yet.
            </p>
          ) : (
            <ul className="max-h-72 space-y-1.5 overflow-y-auto">
              {list.map((person) => {
                const isHost = person.identity === config.hostId;
                return (
                  <li
                    key={person.identity}
                    className="flex items-center gap-2 rounded-2xl bg-white/[0.05] px-3 py-2"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm text-white">
                      {person.name}
                    </span>
                    {isHost ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                        Host
                      </span>
                    ) : armed === person.identity ? (
                      <>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => act(person.identity, true)}
                          className="rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-bold text-white disabled:opacity-60"
                        >
                          Ban
                        </button>
                        <button
                          type="button"
                          onClick={() => setArmed(null)}
                          className="px-1.5 text-[11px] font-semibold text-white/50 hover:text-white"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => act(person.identity, false)}
                          className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-white/20 disabled:opacity-60"
                        >
                          Remove
                        </button>
                        <button
                          type="button"
                          onClick={() => setArmed(person.identity)}
                          className="rounded-full px-2 py-1 text-[11px] font-semibold text-red-300 hover:bg-red-500/15"
                        >
                          Ban…
                        </button>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {message && (
            <p className="mt-2 px-1 text-[11px] text-white/60">{message}</p>
          )}
        </div>
      )}
    </>
  );
}
