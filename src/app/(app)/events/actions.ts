"use server";

import { setEventRegistration } from "@/lib/event-responses";
import { requireMember } from "@/lib/session";

/** Bouton "Register" : s'inscrire (on = true) ou se désinscrire. */
export async function registerToEvent(eventId: string, on: boolean): Promise<void> {
  const user = await requireMember();
  await setEventRegistration(user.id, eventId, on === true);
}
