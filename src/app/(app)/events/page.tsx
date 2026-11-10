import Link from "next/link";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { delay, GlassCard, PageHeader } from "@/components/app-ui";
import { prisma } from "@/lib/prisma";
import { MemberAvatar } from "@/components/member-avatar";
import { getEventResponses, type EventPerson } from "@/lib/event-responses";
import { requireMember } from "@/lib/session";
import { EventResponseButtons } from "./event-response-buttons";
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
  // Venu du calendrier : l'événement à montrer.
  const wanted = (await searchParams).event;
  const focusId = typeof wanted === "string" ? wanted : null;
  const [upcoming, announcements] = await loadEvents();
  const responsesById = await getEventResponses(
    upcoming.map((event) => event.id),
    user.id,
  );

  return (
    <>
      <PageHeader title="Events" subtitle="Classes and news from the club." />
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
                const responses = responsesById.get(event.id);
                const going = responses?.going ?? [];
                const interested = responses?.interested ?? [];
                const everyone = [...going, ...interested];
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
                      {/* Carte à image, comme un plan de voyage */}
                      <div className="group relative h-44 overflow-hidden">
                        {event.imageType ? (
                          // eslint-disable-next-line @next/next/no-img-element -- image privée servie par notre API
                          <img
                            src={`/api/event/image/${event.id}`}
                            alt=""
                            className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-[linear-gradient(135deg,#2e3192,#7a082e_55%,#9c0b3b)]" />
                        )}
                        {/* Voile sombre pour lire le texte */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/5" />

                        {event.startsAt && (
                          <span className="absolute left-4 top-4 rounded-full bg-black/45 px-3 py-1 text-xs font-bold text-white ring-1 ring-white/25 backdrop-blur-sm">
                            {formatChip(event.startsAt)}
                          </span>
                        )}

                        <div className="absolute inset-x-4 bottom-4">
                          <h3 className="font-display text-xl font-bold uppercase tracking-wide text-white drop-shadow">
                            {event.title}
                          </h3>
                          {event.description && (
                            <p className="mt-0.5 line-clamp-2 text-sm text-white/80">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Participer / intéressé, et qui */}
                      <div className="space-y-3 p-4">
                        <EventResponseButtons
                          eventId={event.id}
                          mine={responses?.mine ?? null}
                          goingCount={going.length}
                          interestedCount={interested.length}
                        />

                        {everyone.length > 0 && (
                          <details className="group/who">
                            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl text-xs text-white/65 transition hover:text-white [&::-webkit-details-marker]:hidden">
                              <span className="flex -space-x-2">
                                {everyone.slice(0, 4).map((person) => (
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
                              <span>See who is going or interested</span>
                              <span aria-hidden className="transition-transform group-open/who:rotate-180">
                                ▾
                              </span>
                            </summary>
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                              <PeopleList title="Going" people={going} />
                              <PeopleList title="Interested" people={interested} />
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
                  <GlassCard className="flex gap-3.5">
                    <span className="neu-inset flex size-10 shrink-0 items-center justify-center rounded-xl text-accent">
                      <MegaphoneIcon />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-white">{event.title}</p>
                      {event.description && (
                        <p className="mt-0.5 text-sm leading-5 text-white/70">{event.description}</p>
                      )}
                      <p className="mt-1 text-xs text-white/45">{formatDay(event.createdAt)}</p>
                    </div>
                  </GlassCard>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

/** Une liste de personnes (Going ou Interested), chaque nom ouvre la fiche. */
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
                <span className="truncate">{person.name}</span>
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

/** La pastille de la carte : "16 Nov · 18:00". */
function formatChip(date: Date): string {
  const day = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(date);
  const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(date);
  return `${day} · ${time}`;
}

function formatDay(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(date);
}

function MegaphoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 11v3a1 1 0 0 0 1 1h2l3.5 4a1 1 0 0 0 1.5-.8V6.8a1 1 0 0 0-1.5-.8L6 10H4a1 1 0 0 0-1 1Z" />
      <path d="M14 8.5a5 5 0 0 1 0 7M17.5 6a9 9 0 0 1 0 12" />
    </svg>
  );
}
