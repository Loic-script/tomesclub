"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { MemberAvatar } from "@/components/member-avatar";
import type { CallableMember } from "@/lib/calls";
import { startDirectCall } from "./actions";

// Les membres en grille d'icônes rondes (comme un calendrier d'avatars) :
// on touche un visage pour lancer l'appel vidéo.
export type CallListMember = CallableMember & { online?: boolean; following?: boolean };

export function MembersCallList({
  members,
  emptyText = "No other members yet. Invite your friends to join the club!",
}: {
  members: CallListMember[];
  /** Le texte quand la liste est vide. */
  emptyText?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [callingId, setCallingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (members.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-white/60">{emptyText}</p>
    );
  }

  function call(memberId: string) {
    setError(null);
    setCallingId(memberId);
    startTransition(async () => {
      const result = await startDirectCall(memberId);
      // S'il n'y a pas d'erreur, la navigation vers l'appel est déjà partie.
      if (result?.error) {
        setError(result.error);
        setCallingId(null);
      }
    });
  }

  return (
    <div>
      <ul className="grid grid-cols-4 gap-x-2 gap-y-5 pt-2 sm:grid-cols-5">
        {members.map((member) => {
          const calling = callingId === member.id;
          return (
            <li key={member.id} className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={() => call(member.id)}
                disabled={callingId !== null}
                title={`Call ${member.firstName}`}
                className="group flex w-full justify-center disabled:opacity-60"
              >
                <span className="relative">
                  {/* Onde quand l'appel part */}
                  {calling && (
                    <span aria-hidden className="anim-ping absolute inset-0 rounded-full bg-brand/30" />
                  )}
                  <span
                    className={`neu-sm relative block rounded-full p-1 transition-all duration-200 ${
                      calling
                        ? "ring-2 ring-accent"
                        : "group-hover:-translate-y-0.5 group-hover:ring-2 group-hover:ring-accent"
                    }`}
                  >
                    <MemberAvatar
                      userId={member.id}
                      name={`${member.firstName} ${member.lastName}`}
                      hasPhoto={member.hasPhoto}
                      size="size-14"
                    />
                  </span>
                  {/* Point vert : en ligne */}
                  {member.online && (
                    <span
                      role="img"
                      aria-label="Online"
                      className="absolute right-0.5 top-0.5 size-3.5 rounded-full border-2 border-white bg-green-500"
                    />
                  )}
                  {/* Petit badge téléphone */}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full text-white shadow transition-colors ${
                      calling ? "bg-accent" : "bg-brand group-hover:bg-accent"
                    }`}
                  >
                    <CallIcon />
                  </span>
                </span>
              </button>

              {/* Le prénom ouvre la fiche du membre */}
              <Link
                href={`/members/${member.id}`}
                className={`max-w-16 truncate text-xs font-medium transition hover:text-accent ${
                  calling ? "text-accent" : "text-white/80"
                }`}
              >
                {calling ? "Calling..." : member.firstName}
              </Link>
            </li>
          );
        })}
      </ul>
      <p aria-live="polite" className="mt-2 min-h-5 text-sm text-red-600">
        {error}
      </p>
    </div>
  );
}

function CallIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.4 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.6 1.9Z" />
    </svg>
  );
}
