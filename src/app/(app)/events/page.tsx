import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import {
  Card,
  DateBlock,
  delay,
  EmptyState,
  PageHeader,
  PageSkeleton,
  SectionHeader,
} from "@/components/app-ui";
import { CalendarIcon, ClockIcon, MegaphoneIcon } from "@/components/icons";
import { SideCalendar } from "@/components/side-calendar";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";

export const metadata: Metadata = { title: "Events" };

// Page /events : les cours et événements programmés par le coach, et ses annonces.
export default function EventsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <EventsHome />
    </Suspense>
  );
}

type ClubEvent = Awaited<ReturnType<typeof loadEvents>>[number][number];

async function EventsHome() {
  await requireMember();
  const [upcoming, announcements] = await loadEvents();
  const [featured, ...others] = upcoming;
  const eventDates = upcoming.flatMap((event) =>
    event.startsAt ? [event.startsAt.toISOString()] : [],
  );

  return (
    <>
      <PageHeader title="Events" subtitle="Classes and news from the club." />

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_var(--spacing-rail)]">
        <div className="min-w-0 space-y-10">
          {/* ----- Les cours à venir ----- */}
          <section aria-labelledby="upcoming" className="anim-rise" style={delay(80)}>
            <SectionHeader id="upcoming" title="Upcoming" count={upcoming.length} />
            {featured === undefined ? (
              <EmptyState
                icon={<CalendarIcon />}
                title="No class scheduled yet"
                description="New classes from the coach will appear here. Check back soon!"
              />
            ) : (
              <div className="space-y-4">
                <EventCard event={featured} featured />
                {others.length > 0 && (
                  <ul className="grid gap-4 sm:grid-cols-2">
                    {others.map((event, index) => (
                      <li
                        key={event.id}
                        className="anim-rise flex"
                        style={delay(140 + Math.min(index, 6) * 60)}
                      >
                        <EventCard event={event} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>

          {/* ----- Les annonces ----- */}
          <section aria-labelledby="announcements" className="anim-rise" style={delay(200)}>
            <SectionHeader id="announcements" title="Announcements" count={announcements.length} />
            {announcements.length === 0 ? (
              <EmptyState icon={<MegaphoneIcon />} title="No announcement right now" />
            ) : (
              <Card padded={false}>
                <ul className="divide-y divide-line">
                  {announcements.map((event) => (
                    <li key={event.id} className="flex gap-4 p-5">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand">
                        <MegaphoneIcon />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                          <h3 className="font-semibold text-ink">{event.title}</h3>
                          <time
                            dateTime={event.createdAt.toISOString()}
                            className="text-xs text-mute"
                          >
                            {formatDay(event.createdAt)}
                          </time>
                        </div>
                        {event.description && (
                          <p className="mt-1 whitespace-pre-line text-sm leading-6 text-mute">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </section>
        </div>

        {/* ----- Le calendrier : les jours de cours y sont marqués ----- */}
        <aside className="anim-rise min-w-0 max-xl:hidden xl:sticky xl:top-10" style={delay(160)}>
          <SideCalendar eventDates={eventDates} />
        </aside>
      </div>
    </>
  );
}

/** Une carte d'événement : l'image en haut, le texte sur fond blanc (toujours lisible). */
function EventCard({ event, featured = false }: { event: ClubEvent; featured?: boolean }) {
  return (
    <article
      className={`card group flex w-full flex-col overflow-hidden ${featured ? "md:flex-row" : ""}`}
    >
      {/* L image seulement si le coach en a mis une : pas de bloc vide. */}
      {event.imageType && (
        <div
          className={`relative shrink-0 overflow-hidden bg-brand-50 ${
            featured ? "aspect-video md:aspect-auto md:min-h-64 md:w-1/2" : "aspect-video"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- image privée servie par notre API */}
          <img
            src={`/api/event/image/${event.id}`}
            alt=""
            className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
      )}

      <div className={`flex flex-1 gap-4 p-5 ${featured ? "md:p-7" : ""}`}>
        {event.startsAt && <DateBlock date={event.startsAt} size={featured ? "lg" : "md"} />}
        <div className="min-w-0 flex-1">
          {featured && <p className="eyebrow mb-1 text-brand">Next class</p>}
          <h3
            className={`break-words font-display font-semibold leading-snug text-ink ${
              featured ? "text-xl sm:text-2xl" : "text-lg"
            }`}
          >
            {event.title}
          </h3>
          {event.startsAt && (
            <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-mute">
              <ClockIcon className="size-4" />
              <time dateTime={event.startsAt.toISOString()}>{formatWhen(event.startsAt)}</time>
            </p>
          )}
          {event.description && (
            <p
              className={`mt-3 text-sm leading-6 text-mute ${featured ? "line-clamp-5" : "line-clamp-3"}`}
            >
              {event.description}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

/** Champs utiles seulement : surtout pas les octets de l'image (trop lourds). */
const EVENT_FIELDS = {
  id: true,
  title: true,
  description: true,
  startsAt: true,
  imageType: true,
  createdAt: true,
} as const;

/** Charge les événements à venir et les annonces (dépend de l'heure de la requête). */
async function loadEvents() {
  await connection();
  return Promise.all([
    prisma.event.findMany({
      // On garde un événement affiché jusqu'à 2 h après son début.
      where: { kind: "event", startsAt: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) } },
      orderBy: { startsAt: "asc" },
      take: 20,
      select: EVENT_FIELDS,
    }),
    prisma.event.findMany({
      where: { kind: "announcement" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: EVENT_FIELDS,
    }),
  ]);
}

/** "Saturday 16 Nov · 18:00" */
function formatWhen(date: Date): string {
  const day = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(date);
  const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(date);
  return `${day} · ${time}`;
}

function formatDay(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
