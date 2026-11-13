"use server";

import { isAdmin } from "@/lib/admin";
import {
  canModerate,
  hostOf,
  removeParticipant,
  type Actor,
} from "@/lib/moderation";
import { requireMember } from "@/lib/session";

export type ModerationResult = { ok: true } | { ok: false; error: string };

/**
 * L'hôte (Leader / Teacher) ou l'admin retire quelqu'un de son room / événement.
 * ban = la personne ne peut plus revenir. On ne retire jamais l'hôte ni l'admin.
 */
export async function removeParticipantAction(
  kind: string,
  targetId: string,
  userId: string,
  ban: boolean,
): Promise<ModerationResult> {
  if (kind !== "room" && kind !== "event")
    return { ok: false, error: "Unknown room." };
  // Une Server Action est un point d'entrée public : on revérifie qui agit.
  const actor: Actor = (await isAdmin())
    ? { id: "coach", coach: true }
    : { id: (await requireMember()).id, coach: false };
  if (!(await canModerate(kind, targetId, actor))) {
    return {
      ok: false,
      error: "Only the host (Leader or Teacher) or the admin can do this.",
    };
  }
  const host = await hostOf(kind, targetId);
  if (!userId || userId === "coach" || userId === actor.id || userId === host) {
    return { ok: false, error: "You can't remove this person." };
  }
  await removeParticipant(kind, targetId, userId, ban === true);
  return { ok: true };
}
