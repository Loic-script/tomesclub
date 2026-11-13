import "server-only";
import { createRoomServiceClient } from "@/lib/livekit";
import { notifyAllMembers } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { ringMembers } from "@/lib/rings";

// Le direct video d un evenement : l admin le lance, les membres le rejoignent.

/** Les salles LiveKit des evenements : "event_<id>". */
export const EVENT_ROOM_PREFIX = "event_";

/** La salle se ferme 30 minutes apres le depart de la derniere personne. */
const EMPTY_TIMEOUT_SECONDS = 30 * 60;
const MAX_PARTICIPANTS = 60;

/** Le direct est-il en cours ? */
export function eventIsLive(event: { liveStartedAt: Date | null; liveEndedAt: Date | null }): boolean {
  return event.liveStartedAt !== null && event.liveEndedAt === null;
}

/** L evenement pour la page du direct (sans les octets de l image). */
export function getLiveEvent(eventId: string) {
  return prisma.event.findFirst({
    where: { id: eventId, kind: "event" },
    select: {
      id: true,
      title: true,
      description: true,
      startsAt: true,
      liveStartedAt: true,
      liveEndedAt: true,
      activity: true,
      topic: true,
      durationMin: true,
      maxParticipants: true,
      createdById: true,
    },
  });
}

/** Lance le direct et previent tous les membres. False = evenement introuvable. */
export async function startEventLive(eventId: string): Promise<boolean> {
  const event = await prisma.event.findFirst({
    where: { id: eventId, kind: "event" },
    select: { id: true, title: true, liveStartedAt: true, liveEndedAt: true, maxParticipants: true },
  });
  if (!event) return false;
  if (eventIsLive(event)) return true; // deja en direct

  await createRoomServiceClient().createRoom({
    name: `${EVENT_ROOM_PREFIX}${event.id}`,
    emptyTimeout: EMPTY_TIMEOUT_SECONDS,
    maxParticipants: Math.min(event.maxParticipants ?? MAX_PARTICIPANTS, MAX_PARTICIPANTS),
  });
  await prisma.event.update({
    where: { id: event.id },
    data: { liveStartedAt: new Date(), liveEndedAt: null },
  });

  await notifyAllMembers({
    kind: "event",
    title: `Live now: ${event.title}`,
    body: "The admin has started. Tap to join!",
    link: `/live/${event.id}`,
  });
  // Les membres inscrits : la fenêtre "appel entrant" sonne chez eux.
  const registered = await prisma.eventResponse.findMany({
    where: { eventId: event.id, status: "registered" },
    select: { userId: true },
  });
  await ringMembers(
    registered.map((row) => row.userId),
    { kind: "event", title: event.title, body: "The live is starting. Join now!", link: `/live/${event.id}` },
  );
  return true;
}

/** Termine le direct : tout le monde sort de la salle video. */
export async function endEventLive(eventId: string): Promise<void> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { liveStartedAt: true, liveEndedAt: true },
  });
  if (!event || !eventIsLive(event)) return;
  try {
    await createRoomServiceClient().deleteRoom(`${EVENT_ROOM_PREFIX}${eventId}`);
  } catch (error) {
    console.warn("[event-live] could not close the LiveKit room:", error);
  }
  await prisma.event.updateMany({
    where: { id: eventId, liveStartedAt: { not: null }, liveEndedAt: null },
    data: { liveEndedAt: new Date() },
  });
}
