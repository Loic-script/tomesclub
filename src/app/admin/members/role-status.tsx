"use client";

import { useTransition } from "react";
import { userTypeLabel } from "@/lib/onboarding-options";
import { acceptRoleAction, refuseRoleAction, resetRoleAction } from "./actions";

// Le statut d'un membre : Member, Leader ✓, Teacher ✓…
// Si une demande Leader / Teacher attend : l'étiquette orange + les boutons Accept / Refuse.

const ROLE_TONE: Record<string, string> = {
  member: "bg-white/10 text-white/75",
  leader: "bg-accent/15 text-accent",
  teacher: "bg-[#6d72ff]/20 text-[#c4c6ff]",
};

export function RoleChip({ role }: { role: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        ROLE_TONE[role] ?? ROLE_TONE.member
      }`}
    >
      {userTypeLabel(role)}
      {role !== "member" && <span aria-label="confirmed">✓</span>}
    </span>
  );
}

export function RoleStatus({
  userId,
  role,
  roleRequest,
  completed,
  large = false,
}: {
  userId: string;
  role: string;
  roleRequest: string | null;
  completed: boolean;
  /** Fiche du membre : boutons plus grands + "Back to Member" pour un Leader / Teacher. */
  large?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (!completed) {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-amber-400/15 px-2.5 py-1 text-[11px] font-semibold text-amber-300">
        <span aria-hidden className="size-1.5 rounded-full bg-amber-300" />
        Not finished
      </span>
    );
  }

  const button = large ? "px-4 py-2 text-sm" : "px-2.5 py-1 text-[11px]";

  if (roleRequest) {
    return (
      <span className="inline-flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-amber-400/15 px-2.5 py-1 text-[11px] font-semibold text-amber-300">
          <span aria-hidden className="anim-ping size-1.5 rounded-full bg-amber-300" />
          {userTypeLabel(roleRequest)} · waiting
        </span>
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => acceptRoleAction(userId))}
          className={`rounded-full bg-emerald-500 font-bold text-white transition hover:bg-emerald-400 disabled:opacity-50 ${button}`}
        >
          Accept
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => refuseRoleAction(userId))}
          className={`rounded-full bg-white/10 font-semibold text-white/75 transition hover:bg-red-500/20 hover:text-red-200 disabled:opacity-50 ${button}`}
        >
          Refuse
        </button>
      </span>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <RoleChip role={role} />
      {large && role !== "member" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => resetRoleAction(userId))}
          className="rounded-full px-3 py-1 text-xs font-semibold text-white/50 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
        >
          Back to Member
        </button>
      )}
    </span>
  );
}
