"use server";

import { isEventStatus, setEventResponse } from "@/lib/event-responses";
import { requireMember } from "@/lib/session";

/** Boutons "Going" / "Interested" : `status` vide = enlever ma réponse. */
export async function respondToEvent(eventId: string, status: string | null): Promise<void> {
  const user = await requireMember();
  if (status !== null && !isEventStatus(status)) return;
  await setEventResponse(user.id, eventId, status);
}
