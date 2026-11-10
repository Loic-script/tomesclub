import type { Metadata } from "next";
import Link from "next/link";
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
import {
  ArrowRightIcon,
  CalendarIcon,
  ChatIcon,
  ClockIcon,
  LockIcon,
  PeopleIcon,
  PhoneIcon,
  PlusIcon,
  ShuffleIcon,
} from "@/components/icons";
import { SideMembers, SideMembersFallback } from "@/components/side-members";
import { listActiveCalls } from "@/lib/calls";
import { prisma } from "@/lib/prisma";
import { listOpenRooms, type OpenRoom } from "@/lib/rooms";
import { requireMember } from "@/lib/session";

export const metadata: Metadata = { title: "Home" };

// Page /home : le point de départ. Un appel qui attend, l'invitation à parler,
// le prochain cours, les salles ouvertes, et qui est en ligne.
export default function HomePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <HomeDashboard />
    </Suspense>
  );
}

/** Tout ce que l'accueil montre (dépend de l'heure de la requête). */
async function loadHome(userId: string) {
  await connection();
  const soon = new Date(Date.now() - 2 * 60 * 60 * 1000);
  return Promise.all([
    listActiveCalls(userId),
    listOpenRooms(userId),
    prisma.event.findFirst({
      where: { kind: "event", startsAt: { gte: soon } },
      orderBy: { startsAt: "asc" },
      select: { title: true, description: true, startsAt: true },
    }),
    prisma.event.count({ where: { kind: "event", startsAt: { gte: soon } } }),
  ]);
}

async function HomeDashboard() {
  const user = await requireMember();
  const [activeCalls, rooms, nextEvent, upcomingCount] = await loadHome(user.id);
  const call = activeCalls[0];

  return (
    <>
      <PageHeader title={`Hello, ${user.firstName}`} subtitle="Ready to practice your English today?" />

      {/* Un appel attend : c'est la première chose à voir. */}
      {call && (
        <div className="anim-rise mb-6" style={delay(60)}>
          <Link
            href={`/call/${call.id}`}
            className="card card-link flex items-center gap-4 border-brand-200 bg-brand-50 p-4 sm:p-5"
          >
            <span className="relative flex size-12 shrink-0 items-center justify-center rounded-full bg-brand text-white">
              <span aria-hidden className="anim-ping absolute inset-0 rounded-full bg-brand/40" />
              <PhoneIcon className="relative size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-ink">
                {call.startedByMe ? "Your call is in progress" : `${call.startedByName} is calling you`}
              </span>
              <span className="block text-sm text-mute">Join the video call now.</span>
            </span>
            <span className="btn btn-primary shrink-0">Join</span>
          </Link>
        </div>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_var(--spacing-rail)]">
        <div className="min-w-0 space-y-6">
          {/* ----- Invitation à parler : l'action principale de l'application ----- */}
          <section
            aria-labelledby="practice-title"
            className="anim-rise relative overflow-hidden rounded-2xl bg-brand p-6 text-white shadow-raised sm:p-8"
            style={delay(100)}
          >
            <ChatIcon className="pointer-events-none absolute -right-6 -top-6 size-48 text-white/[0.07] max-sm:hidden" />
            <p className="text-xs font-semibold uppercase tracking-wider text-white/75">
              Speaking practice
            </p>
            <h2
              id="practice-title"
              className="mt-2 max-w-lg font-display text-2xl font-semibold leading-tight sm:text-3xl"
            >
              Start a conversation in English
            </h2>
            <p className="mt-2 max-w-md text-sm text-white/80 sm:text-base">
              Talk one-to-one with a member, or join a group room. Every conversation counts.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/calls" className="btn btn-lg btn-inverse">
                <ShuffleIcon className="size-5" />
                Find a partner
              </Link>
              <Link
                href="/rooms"
                className="btn btn-lg border-white/30 text-white hover:border-white/50 hover:bg-white/10"
              >
                <PeopleIcon className="size-5" />
                Browse rooms
              </Link>
            </div>

            {/* Le club en ce moment, en une ligne */}
            <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-white/15 pt-5">
              <HeroStat
                value={activeCalls.length}
                label={activeCalls.length === 1 ? "Call now" : "Calls now"}
              />
              <HeroStat
                value={rooms === null ? "–" : rooms.length}
                label={rooms?.length === 1 ? "Open room" : "Open rooms"}
              />
              <HeroStat
                value={upcomingCount}
                label={upcomingCount === 1 ? "Class ahead" : "Classes ahead"}
              />
            </dl>
          </section>

          <div className="grid gap-6 md:grid-cols-2">
            {/* ----- Le prochain cours ----- */}
            <Card className="anim-rise flex flex-col" style={delay(180)}>
              <SectionHeader
                title="Next class"
                action={
                  <Link href="/events" className="btn btn-ghost btn-sm text-brand hover:text-brand">
                    All events
                    <ArrowRightIcon className="size-3.5" />
                  </Link>
                }
              />
              {nextEvent?.startsAt ? (
                <Link
                  href="/events"
                  className="group -m-2 flex flex-1 items-start gap-4 rounded-xl p-2 transition-colors hover:bg-blush/50"
                >
                  <DateBlock date={nextEvent.startsAt} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-ink transition-colors group-hover:text-brand">
                      {nextEvent.title}
                    </span>
                    <span className="mt-1 flex items-center gap-1.5 text-sm text-mute">
                      <ClockIcon className="size-4" />
                      {new Intl.DateTimeFormat("en-GB", {
                        weekday: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(nextEvent.startsAt)}
                    </span>
                    {nextEvent.description && (
                      <span className="mt-2 line-clamp-2 block text-sm text-mute">
                        {nextEvent.description}
                      </span>
                    )}
                  </span>
                </Link>
              ) : (
                <EmptyState
                  className="flex-1 py-8"
                  icon={<CalendarIcon />}
                  title="No class scheduled yet"
                  description="New classes from the coach will appear here."
                />
              )}
            </Card>

            {/* ----- Les salles ouvertes ----- */}
            <Card className="anim-rise flex flex-col" style={delay(240)}>
              <SectionHeader
                title="Open rooms"
                action={
                  <Link href="/rooms" className="btn btn-ghost btn-sm text-brand hover:text-brand">
                    All rooms
                    <ArrowRightIcon className="size-3.5" />
                  </Link>
                }
              />
              <RoomsPreview rooms={rooms} />
            </Card>
          </div>
        </div>

        {/* ----- Qui est là : le contexte social, à droite sur grand écran ----- */}
        <aside className="anim-rise min-w-0 xl:sticky xl:top-10" style={delay(300)}>
          <Suspense fallback={<SideMembersFallback />}>
            <SideMembers className="xl:max-h-[calc(100dvh-5rem)]" />
          </Suspense>
        </aside>
      </div>
    </>
  );
}

/* ---------- Petits morceaux ---------- */

function HeroStat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex min-w-0 flex-col-reverse">
      <dt className="mt-0.5 truncate text-xs text-white/75 sm:text-sm">{label}</dt>
      <dd className="font-display text-2xl font-semibold tabular-nums sm:text-3xl">{value}</dd>
    </div>
  );
}

function RoomsPreview({ rooms }: { rooms: OpenRoom[] | null }) {
  if (rooms === null) {
    return (
      <p className="well flex-1 p-4 text-sm text-mute">
        The video server is not running, so rooms are unavailable right now.
      </p>
    );
  }
  if (rooms.length === 0) {
    return (
      <EmptyState
        className="flex-1 py-8"
        icon={<PeopleIcon />}
        title="No room open right now"
        description="Start one and invite the club to talk."
        action={
          <Link href="/rooms" className="btn btn-soft btn-sm">
            <PlusIcon className="size-3.5" />
            Create a room
          </Link>
        }
      />
    );
  }
  return (
    <ul className="-mx-2 space-y-1">
      {rooms.slice(0, 3).map((room) => (
        <li
          key={room.id}
          className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-blush/50"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 font-display font-semibold text-brand">
            {room.name[0]?.toUpperCase() ?? "R"}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
              <span className="truncate">{room.name}</span>
              {room.isPrivate && <LockIcon className="size-3.5 text-mute" />}
            </span>
            <span className="block truncate text-xs text-mute">
              {room.participants} {room.participants === 1 ? "person" : "people"} · Hosted by{" "}
              {room.isMine ? "you" : room.hostName}
            </span>
          </span>
          <Link href={`/room/${room.id}`} className="btn btn-soft btn-sm">
            Join
          </Link>
        </li>
      ))}
      {rooms.length > 3 && (
        <li className="px-2 pt-1 text-xs text-mute">
          + {rooms.length - 3} more {rooms.length - 3 === 1 ? "room" : "rooms"}
        </li>
      )}
    </ul>
  );
}
