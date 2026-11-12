import "server-only";
import { notifyAdmin } from "@/lib/admin-notifications";
import { formatEventPrice } from "@/lib/event-price";
import { notifyMembers } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

// Les inscriptions aux événements : un membre s'inscrit (ou se désinscrit).
// Une ligne event_response avec status = "registered".

export const REGISTERED = "registered";

export type EventPerson = {
  id: string;
  name: string;
  hasPhoto: boolean;
  /** Événement payant : l'admin a confirmé le paiement. */
  paid: boolean;
};

export type EventRegistrations = {
  people: EventPerson[];
  /** Je suis inscrit. */
  mine: boolean;
  /** Mon paiement est confirmé (événement payant). */
  minePaid: boolean;
};

/** Les inscrits de plusieurs événements (du premier inscrit au dernier), et si je le suis. */
export async function getEventRegistrations(
  eventIds: string[],
  viewerId: string | null,
): Promise<Map<string, EventRegistrations>> {
  const result = new Map<string, EventRegistrations>(eventIds.map((id) => [id, { people: [], mine: false, minePaid: false }]));
  if (eventIds.length === 0) return result;

  const rows = await prisma.eventResponse.findMany({
    where: { eventId: { in: eventIds }, status: REGISTERED },
    orderBy: { createdAt: "asc" },
    select: {
      eventId: true,
      paidAt: true,
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
    if (!entry) continue;
    const profile = row.user.profile;
    entry.people.push({
      id: row.user.id,
      name: profile ? `${profile.firstName} ${profile.lastName}`.trim() : row.user.name,
      hasPhoto: Boolean(profile?.photoType),
      paid: Boolean(row.paidAt),
    });
    if (row.user.id === viewerId) {
      entry.mine = true;
      entry.minePaid = Boolean(row.paidAt);
    }
  }
  return result;
}

/**
 * Inscrit (on = true) ou désinscrit un membre.
 * Renvoie false si l'événement n'existe pas (ou est une annonce).
 */
export async function setEventRegistration(userId: string, eventId: string, on: boolean): Promise<boolean> {
  const event = await prisma.event.findFirst({
    where: { id: eventId, kind: "event" },
    select: { id: true, title: true },
  });
  if (!event) return false;

  if (!on) {
    await prisma.eventResponse.deleteMany({ where: { eventId, userId, status: REGISTERED } });
    return true;
  }

  const existing = await prisma.eventResponse.findUnique({
    where: { eventId_userId_status: { eventId, userId, status: REGISTERED } },
    select: { status: true },
  });
  if (existing) return true;
  await prisma.eventResponse.create({ data: { eventId, userId, status: REGISTERED } });

  // Une nouvelle inscription : l'admin le sait.
  const member = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, profile: { select: { firstName: true, lastName: true } } },
  });
  const name = member?.profile ? `${member.profile.firstName} ${member.profile.lastName}` : member?.name;
  await notifyAdmin({
    kind: "event",
    title: `${name ?? "A member"} registered`,
    body: event.title,
    link: "/admin/events",
  });
  return true;
}

/**
 * L'admin confirme (paid = true) ou annule le paiement d'un inscrit.
 * Le membre reçoit une notification quand son paiement est confirmé.
 */
export async function setRegistrationPaid(eventId: string, userId: string, paid: boolean): Promise<void> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { title: true, isPaid: true, price: true, currency: true },
  });
  if (!event?.isPaid) return;
  const result = await prisma.eventResponse.updateMany({
    where: { eventId, userId, status: REGISTERED, paidAt: paid ? null : { not: null } },
    data: { paidAt: paid ? new Date() : null },
  });
  if (paid && result.count > 0) {
    await notifyMembers([userId], {
      kind: "event",
      title: "Payment confirmed ✓",
      body: `${event.title} · ${formatEventPrice(event)}`,
      link: `/events?event=${eventId}`,
    });
  }
}
