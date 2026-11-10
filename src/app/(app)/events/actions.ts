"use server";

import { isEventStatus, setEventResponse } from "@/lib/event-responses";
import { requireMember } from "@/lib/session";

/** Boutons "Going" / "Interested" : chacun s allume ou s éteint tout seul. */
export async function respondToEvent(eventId: string, status: string, on: boolean): Promise<void> {
  const user = await requireMember();
  if (!isEventStatus(status)) return;
  await setEventResponse(user.id, eventId, status, on === true);
}
