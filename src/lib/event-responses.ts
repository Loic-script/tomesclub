import "server-only";
import { prisma } from "@/lib/prisma";

// "Going" (je participe) et "Interested" (ça m intéresse) sur les événements.
// Les deux sont indépendants : on peut choisir l un, l autre, ou les deux.

export type EventStatus = "going" | "interested";

export function isEventStatus(value: string): value is EventStatus {
  return value === "going" || value === "interested";
}

export type EventPerson = { id: string; name: string; hasPhoto: boolean };

export type EventResponses = {
  going: EventPerson[];
  interested: EventPerson[];
  /** Mes réponses à moi. */
  mine: { going: boolean; interested: boolean };
};

/** Les réponses de plusieurs événements, avec la mienne. */
export async function getEventResponses(
  eventIds: string[],
  viewerId: string,
): Promise<Map<string, EventResponses>> {
  const result = new Map<string, EventResponses>(
    eventIds.map((id) => [id, { going: [], interested: [], mine: { going: false, interested: false } }]),
  );
  if (eventIds.length === 0) return result;

  const rows = await prisma.eventResponse.findMany({
    where: { eventId: { in: eventIds } },
    orderBy: { createdAt: "asc" },
    select: {
      eventId: true,
      status: true,
      user: {
        select: {
          id: true,
          name: true,
          profile: { select: { firstName: true, lastName: true, photoType: true } },
        },
      },
    },
  });

  for (const row of rows) {
    const entry = result.get(row.eventId);
    if (!entry || !isEventStatus(row.status)) continue;
    const profile = row.user.profile;
    entry[row.status].push({
      id: row.user.id,
      name: profile ? `${profile.firstName} ${profile.lastName}`.trim() : row.user.name,
      hasPhoto: Boolean(profile?.photoType),
    });
    if (row.user.id === viewerId) entry.mine[row.status] = true;
  }
  return result;
}

/**
 * Allume (on = true) ou éteint "going" ou "interested" pour un événement.
 * Renvoie false si l événement n existe pas (ou est une annonce).
 */
export async function setEventResponse(
  userId: string,
  eventId: string,
  status: EventStatus,
  on: boolean,
): Promise<boolean> {
  const event = await prisma.event.findFirst({
    where: { id: eventId, kind: "event" },
    select: { id: true },
  });
  if (!event) return false;

  if (on) {
    await prisma.eventResponse.upsert({
      where: { eventId_userId_status: { eventId, userId, status } },
      create: { eventId, userId, status },
      update: {},
    });
  } else {
    await prisma.eventResponse.deleteMany({ where: { eventId, userId, status } });
  }
  return true;
}
