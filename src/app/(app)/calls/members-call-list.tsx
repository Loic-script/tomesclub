"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { EmptyState } from "@/components/app-ui";
import { PeopleIcon, PhoneIcon } from "@/components/icons";
import { MemberAvatar } from "@/components/member-avatar";
import type { CallableMember } from "@/lib/calls";
import { startDirectCall } from "./actions";

type Member = CallableMember & { online: boolean };

// Les membres en grille de cartes : la photo et le nom ouvrent la fiche,
// le bouton "Call" lance l'appel vidéo.
export function MembersCallList({ members }: { members: Member[] }) {
  const [error, setError] = useState<string | null>(null);
  const [callingId, setCallingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (members.length === 0) {
    return (
      <EmptyState
        icon={<PeopleIcon />}
        title="No other members yet"
        description="Invite your friends to join the club, then call them here."
      />
    );
  }

  function call(memberId: string) {
    setError(null);
    setCallingId(memberId);
    startTransition(async () => {
      const result = await startDirectCall(memberId);
      // S il n y a pas d erreur, la navigation vers l appel est déjà partie.
      if (result?.error) {
        setError(result.error);
        setCallingId(null);
      }
    });
  }

  return (
    <div>
      <p aria-live="polite" className={error ? "well mb-4 px-4 py-3 text-sm font-medium text-danger" : "sr-only"}>
        {error}
      </p>

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {members.map((member) => {
          const calling = callingId === member.id;
          const name = `${member.firstName} ${member.lastName}`;
          const details = member.country ?? member.city ?? "";
          return (
            <li
              key={member.id}
              className={`card flex items-center gap-3 p-3 pr-4 transition-colors ${
                calling ? "border-brand-200 bg-brand-50" : "hover:border-blush-2"
              }`}
            >
              <Link
                href={`/members/${member.id}`}
                className="group flex min-w-0 flex-1 items-center gap-3 rounded-xl"
              >
                <MemberAvatar
                  userId={member.id}
                  name={name}
                  hasPhoto={member.hasPhoto}
                  size="size-12"
                  online={member.online}
                />
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-ink transition-colors group-hover:text-brand">
                    {name}
                  </span>
                  <span
                    className={`block truncate text-xs ${
                      member.online ? "font-medium text-success" : "text-mute"
                    }`}
                  >
                    {member.online ? "Online now" : details || "Member"}
                    {member.englishLevel && (
                      <span className="font-normal capitalize text-mute"> · {member.englishLevel}</span>
                    )}
                  </span>
                </span>
              </Link>

              <button
                type="button"
                onClick={() => call(member.id)}
                disabled={callingId !== null}
                aria-label={calling ? `Calling ${member.firstName}...` : `Call ${member.firstName}`}
                className={`btn btn-sm relative shrink-0 ${calling ? "btn-primary" : "btn-soft"}`}
              >
                {calling && (
                  <span aria-hidden className="anim-ping absolute inset-0 rounded-lg bg-brand/30" />
                )}
                <PhoneIcon className="size-3.5" />
                <span aria-hidden>{calling ? "Calling..." : "Call"}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
