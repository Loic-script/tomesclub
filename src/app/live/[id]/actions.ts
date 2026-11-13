"use server";

import { isAdmin } from "@/lib/admin";
import { endEventLive, getLiveEvent } from "@/lib/event-live";
import { requireMember } from "@/lib/session";

/** Le compte à rebours est fini : le serveur vérifie, puis termine le direct (tout le monde sort). */
export async function endLiveIfOver(eventId: string): Promise<void> {
  if (!(await isAdmin())) await requireMember();
  const event = await getLiveEvent(eventId);
  if (!event?.liveStartedAt || !event.durationMin) return;
  if (Date.now() < event.liveStartedAt.getTime() + event.durationMin * 60 * 1000) return;
  await endEventLive(eventId);
}
