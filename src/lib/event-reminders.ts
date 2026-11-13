import "server-only";
import { REGISTERED } from "@/lib/event-responses";
import { notifyMembers } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

// Le rappel des événements : 24 h avant le début, tout le monde reçoit une notification.
// Les inscrits la reçoivent toujours ; les autres membres, s'ils n'ont pas coupé les notifications Events.
// Lancé toutes les 5 minutes par src/instrumentation.ts.

const DAY_MS = 24 * 60 * 60_000;
const HOUR_MS = 60 * 60_000;

/** « in 24 hours », « in 5 hours »… (un événement créé moins de 24 h avant reçoit le vrai temps restant). */
function startsIn(startsAt: Date, now: Date): string {
  const hours = Math.round((startsAt.getTime() - now.getTime()) / HOUR_MS);
  if (hours >= 23) return "in 24 hours";
  if (hours < 1) return "in less than an hour";
  return hours === 1 ? "in 1 hour" : `in ${hours} hours`;
}

/** Envoie les rappels qui sont dus. Renvoie le nombre d'événements rappelés. */
export async function sendEventReminders(): Promise<number> {
  const now = new Date();
  const due = await prisma.event.findMany({
    where: {
      kind: "event",
      status: "published",
      reminderSentAt: null,
      liveStartedAt: null,
      startsAt: { gt: now, lte: new Date(now.getTime() + DAY_MS) },
    },
    select: { id: true, title: true, startsAt: true },
  });

  let sent = 0;
  for (const event of due) {
    if (!event.startsAt) continue;
    // On réserve d'abord le rappel : il n'est jamais envoyé deux fois.
    const claimed = await prisma.event.updateMany({
      where: { id: event.id, reminderSentAt: null },
      data: { reminderSentAt: now },
    });
    if (claimed.count === 0) continue;

    const registered = (
      await prisma.eventResponse.findMany({
        where: { eventId: event.id, status: REGISTERED },
        select: { userId: true },
      })
    ).map((row) => row.userId);
    const others = (
      await prisma.profile.findMany({
        where: { completedAt: { not: null }, userId: { notIn: registered } },
        select: { userId: true },
      })
    ).map((row) => row.userId);

    const title = `Reminder: ${event.title} starts ${startsIn(event.startsAt, now)}`;
    const link = `/events?event=${event.id}`;
    await notifyMembers(
      registered,
      {
        kind: "event",
        title,
        body: "You are registered. See you there!",
        link,
      },
      { always: true },
    );
    await notifyMembers(others, {
      kind: "event",
      title,
      body: "Register now so you don't miss it.",
      link,
    });
    sent += 1;
  }
  return sent;
}
