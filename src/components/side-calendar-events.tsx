import { connection } from "next/server";
import { SideCalendar, type CalendarEvent } from "@/components/side-calendar";
import { prisma } from "@/lib/prisma";

/** Les événements à venir (comme la page Events : visibles jusqu à 2 h après le début). */
async function loadCalendarEvents(): Promise<CalendarEvent[]> {
  await connection();
  const events = await prisma.event.findMany({
    where: { kind: "event", status: "published", startsAt: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) } },
    orderBy: { startsAt: "asc" },
    take: 60,
    select: { id: true, title: true, startsAt: true },
  });
  return events.flatMap((event) =>
    event.startsAt
      ? [{ id: event.id, title: event.title, startsAt: event.startsAt.toISOString() }]
      : [],
  );
}

// Le calendrier de gauche, avec les jours d événement marqués en orange.
// Lit la base au moment de la requête : à placer dans un <Suspense>.
export async function SideCalendarWithEvents({ className = "" }: { className?: string }) {
  const events = await loadCalendarEvents();
  return <SideCalendar className={className} events={events} />;
}
