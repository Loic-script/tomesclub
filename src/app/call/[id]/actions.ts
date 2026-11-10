"use server";

import { endCallRoom, getCallForMember } from "@/lib/calls";
import { requireUser } from "@/lib/session";

/** Appelée quand les 5 minutes de l appel sont finies : les deux personnes sortent. */
export async function endCallForTime(callId: string): Promise<void> {
  const user = await requireUser();
  // Seule une personne de l appel peut le terminer.
  const call = await getCallForMember(callId, user.id);
  if (!call) return;
  await endCallRoom(call.id);
}
