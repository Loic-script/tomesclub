import Link from "next/link";
import { AnnouncementCard } from "@/components/announcement-card";
import { markTabRead } from "@/lib/notifications";
import { MyEvents } from "./my-events";
import { canProposeEvents, formatMoney, listMyEvents } from "@/lib/member-events";
import { listActivities } from "@/lib/activities";
import { NewEventButton } from "@/app/admin/events/create-event-form";
import { privateRoomPayment } from "@/lib/private-room-payment";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { delay, GlassCard, PageHeader } from "@/components/app-ui";
import { prisma } from "@/lib/prisma";
import { MemberAvatar } from "@/components/member-avatar";
import { eventIsLive } from "@/lib/event-live";
import { formatEventPrice } from "@/lib/event-price";
import { getEventRegistrations, type EventPerson } from "@/lib/event-responses";
import { requireMember } from "@/lib/session";
import { RegisterButton } from "./event-response-buttons";
import { type EventDetails } from "./event-details-sheet";
import { EventCover } from "@/components/event-cover";
import { proposeEventAction } from "./actions";
import { ScrollToEvent } from "./scroll-to-event";

export const metadata: Metadata = { title: "Events" };

// Page /events : les cours/événements programmés par l'admin, et ses annonces.
export default function EventsPage({ searchParams }: PageProps<"/events">) {
  return (
    <Suspense fallback={<p className="pt-20 text-center text-white/60">Loading...</p>}>
      <EventsHome searchParams={searchParams} />
    </Suspense>
  );
}

async function EventsHome({ searchParams }: { searchParams: PageProps<"/events">["searchParams"] }) {
  const user = await requireMember();
  // Ce menu est ouvert : sa pastille disparaît
  await markTabRead(user.id, "events");
  // Venu du calendrier : l'événement à montrer.
  const wanted = (await searchParams).event;
  const focusId = typeof wanted === "string" ? wanted : null;
  const [upcoming, announcements] = await loadEvents();
  // Leader / Teacher : proposer un événement, et voir les siens (avec les gains)
  const canPropose = await canProposeEvents(user.id);
  const [activityList, myRows] = canPropose
    ? await Promise.all([listActivities(), listMyEvents(user.id)])
    : [[], []];
  const activityChoices = activityList.map((activity) => ({
    key: activity.key,
    name: activity.name,
    topics: activity.categories.flatMap((category) => category.topics),
  }));
  const myEvents = myRows.map((event) => ({
    id: event.id,
    title: event.title,
    status: event.status,
    whenLabel: event.startsAt ? formatChip(event.startsAt) : null,
    priceLabel: formatEventPrice(event),
    registered: event.registered,
    paidCount: event.paidCount,
    live: eventIsLive(event),
    ended: Boolean(event.liveEndedAt),
    revenue: event.revenue
      ? {
          collected: formatMoney(event.revenue.collected, event.revenue.currency),
          host: formatMoney(event.revenue.hostShare, event.revenue.currency),
          admin: formatMoney(event.revenue.adminShare, event.revenue.currency),
        }
      : null,
  }));
  // Le numéro MVola de l'admin (événements payants)
  const account = privateRoomPayment();
  const registrationsById = await getEventRegistrations(
    upcoming.map((event) => event.id),
    user.id,
  );

  return (
    <>
      <PageHeader
        eyebrow="Club agenda"
        title="Events"
        subtitle="Classes and news from the club."
        right={canPropose ? <NewEventButton activities={activityChoices} member={{ action: proposeEventAction }} /> : undefined}
      />

      {/* Les événements que j'organise (Leader / Teacher) */}
      {canPropose && myEvents.length > 0 && (
        <section className="anim-rise mb-6 space-y-3" style={delay(120)}>
          <h2 className="px-1 font-display text-lg font-bold text-white">My events</h2>
          <MyEvents events={myEvents} />
        </section>
      )}
      {focusId && <ScrollToEvent id={focusId} />}

      <div className="space-y-6">
        <section className="anim-rise space-y-3" style={delay(150)}>
          <h2 className="px-1 font-display text-lg font-bold text-white">Upcoming</h2>
          {upcoming.length === 0 ? (
            <GlassCard>
              <p className="text-center text-sm text-white/60">
                No class scheduled yet. Check back soon!
              </p>
            </GlassCard>
          ) : (
            <ul className="space-y-4">
              {upcoming.map((event, index) => {
                const registrations = registrationsById.get(event.id);
                const people = registrations?.people ?? [];
                // La fenêtre des détails (description complète)
                const details: EventDetails = {
                  title: event.title,
                  description: event.description,
                  dateLabel: event.startsAt ? formatLong(event.startsAt) : null,
                  priceLabel: formatEventPrice(event),
                  isPaid: event.isPaid,
                  imageUrl: event.imageType ? `/api/event/image/${event.id}` : null,
                };
                return (
                  <li
                    key={event.id}
                    id={`event-${event.id}`}
                    className={`anim-rise scroll-mt-6 rounded-3xl ${
                      event.id === focusId ? "ring-2 ring-accent ring-offset-4 ring-offset-transparent" : ""
                    }`}
                    style={delay(200 + index * 90)}
                  >
                    <article className="overflow-hidden rounded-3xl bg-white/5 shadow-[0_22px_45px_-15px_rgba(0,0,0,0.6)] ring-1 ring-white/10">
                      {/* L'image, bien visible (date, prix, direct) */}
                      <EventCover event={event} />

                      {/* Le titre sous l'image (jamais coupé), puis s'inscrire */}
                      <div className="space-y-3 p-4">
                        <div>
                          <h3 className="break-words pr-20 font-display text-lg font-bold uppercase leading-snug tracking-wide text-white">
                            {event.title}
                          </h3>
                          {event.description && (
                            <p className="mt-1.5 whitespace-pre-line break-words text-sm leading-relaxed text-white/75">
                              {event.description}
                            </p>
                          )}
                        </div>
                        {eventIsLive(event) && (
                          <Link
                            href={`/live/${event.id}`}
                            className="neu-btn flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-500 to-brand px-4 py-3 text-sm font-bold text-white shadow-lg shadow-red-900/40"
                          >
                            <span aria-hidden>▶</span>
                            Join the live
                          </Link>
                        )}
                        <RegisterButton
                          details={details}
                          eventId={event.id}
                          registered={registrations?.mine ?? false}
                          locked={registrations?.minePaid ?? false}
                          payment={
                            event.isPaid
                              ? {
                                  label: formatEventPrice(event),
                                  paid: registrations?.minePaid ?? false,
                                  mvola: account.mvola,
                                  receiver: account.receiver,
                                }
                              : null
                          }
                        />

                        {people.length > 0 && (
                          <details className="group/who">
                            <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-xl px-1 py-1 text-xs text-white/65 transition hover:text-white [&::-webkit-details-marker]:hidden">
                              <span className="flex -space-x-2">
                                {people.slice(0, 5).map((person) => (
                                  <span key={person.id} className="rounded-full ring-2 ring-[#2b1538]">
                                    <MemberAvatar
                                      userId={person.id}
                                      name={person.name}
                                      hasPhoto={person.hasPhoto}
                                      size="size-6"
                                    />
                                  </span>
                                ))}
                              </span>
                              <span>
                                <strong className="font-semibold text-white">{people.length}</strong> registered
                              </span>
                              <span className="ml-auto text-white/45">See who</span>
                              <span aria-hidden className="transition-transform group-open/who:rotate-180">
                                ▾
                              </span>
                            </summary>
                            <div className="mt-3">
                              <PeopleList title="Registered" people={people} />
                            </div>
                          </details>
                        )}
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="anim-rise space-y-3" style={delay(350)}>
          <h2 className="px-1 font-display text-lg font-bold text-white">Announcements</h2>
          {announcements.length === 0 ? (
            <GlassCard>
              <p className="text-center text-sm text-white/60">No announcement right now.</p>
            </GlassCard>
          ) : (
            <ul className="space-y-4">
              {announcements.map((event) => (
                <li key={event.id}>
                  <AnnouncementCard
                    title={event.title}
                    body={event.description}
                    dateLabel={formatDay(event.createdAt)}
                    fresh={isFresh(event.createdAt)}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

/** La liste des inscrits, chaque nom ouvre la fiche. */
function PeopleList({ title, people }: { title: string; people: EventPerson[] }) {
  return (
    <div className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-accent">
        {title} · {people.length}
      </p>
      {people.length === 0 ? (
        <p className="text-xs text-white/45">Nobody yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {people.map((person) => (
            <li key={person.id}>
              <Link
                href={`/members/${person.id}`}
                className="flex items-center gap-2 rounded-lg text-sm text-white/85 transition hover:text-white"
              >
                <MemberAvatar
                  userId={person.id}
                  name={person.name}
                  hasPhoto={person.hasPhoto}
                  size="size-7"
                />
                <span className="break-words">{person.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
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
  liveStartedAt: true,
  liveEndedAt: true,
  isPaid: true,
  price: true,
  currency: true,
} as const;

/** Charge les événements à venir et les annonces (dépend de l'heure de la requête). */
async function loadEvents() {
  await connection();
  return Promise.all([
    prisma.event.findMany({
      // On garde un événement affiché jusqu'à 2 h après son début.
      // ... et tant que son direct est en cours.
      where: {
        kind: "event",
        status: "published",
        OR: [
          { startsAt: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) } },
          { liveStartedAt: { not: null }, liveEndedAt: null },
        ],
      },
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

/** La pastille de la carte : "16 Nov · 18:00". */
/** « Saturday 28 November · 20:30 » */
function formatLong(date: Date): string {
  const day = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(date);
  const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(date);
  return `${day} · ${time}`;
}

function formatChip(date: Date): string {
  const day = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(date);
  const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(date);
  return `${day} · ${time}`;
}

function formatDay(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(date);
}


/** Une annonce de moins de 3 jours : badge « New » et petite animation. */
function isFresh(createdAt: Date): boolean {
  return Date.now() - createdAt.getTime() < 3 * 24 * 60 * 60 * 1000;
}
