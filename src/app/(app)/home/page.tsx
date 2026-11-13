import type { Metadata } from "next";
import { markTabRead } from "@/lib/notifications";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { delay, GlassCard, PageHeader } from "@/components/app-ui";
import { MemberAvatar } from "@/components/member-avatar";
import { listActiveCalls } from "@/lib/calls";
import { prisma } from "@/lib/prisma";
import { listOpenRooms } from "@/lib/rooms";
import { requireMember } from "@/lib/session";

export const metadata: Metadata = { title: "Home" };

// Page /home : l'accueil de l'application — un coup d'œil sur le club
// et les grandes tuiles vers chaque section.
export default function HomePage() {
  return (
    <Suspense fallback={<p className="pt-20 text-center text-white/60">Loading...</p>}>
      <HomeDashboard />
    </Suspense>
  );
}

/** Tout ce que l'accueil montre (dépend de l'heure de la requête). */
async function loadHome(userId: string) {
  await connection();
  const soon = new Date(Date.now() - 2 * 60 * 60 * 1000);
  return Promise.all([
    prisma.profile.findUnique({ where: { userId }, select: { photoType: true } }),
    listActiveCalls(userId),
    listOpenRooms(userId),
    prisma.event.findFirst({
      where: { kind: "event", status: "published", startsAt: { gte: soon } },
      orderBy: { startsAt: "asc" },
      select: { title: true, startsAt: true },
    }),
    prisma.event.count({ where: { kind: "event", status: "published", startsAt: { gte: soon } } }),
  ]);
}

async function HomeDashboard() {
  const user = await requireMember();
  // Ce menu est ouvert : sa pastille disparaît
  await markTabRead(user.id, "home");
  const [profile, activeCalls, rooms, nextEvent, upcomingCount] = await loadHome(user.id);

  return (
    <>
      <PageHeader
        eyebrow="Welcome back"
        title={
          <>
            Hello, <span className="text-highlight">{user.firstName}</span>
          </>
        }
        subtitle="Ready to practice your English today?"
        right={
          <Link href="/profile" aria-label="My profile" className="neu-sm neu-btn rounded-full p-1">
            <MemberAvatar
              userId={user.id}
              name={user.firstName}
              hasPhoto={Boolean(profile?.photoType)}
              size="size-12"
            />
          </Link>
        }
      />

      <div className="space-y-5">
        {/* Un appel t'attend ? C'est la première chose à voir. */}
        {activeCalls.length > 0 && (
          <div className="anim-rise" style={delay(120)}>
            <Link
              href={`/call/${activeCalls[0].id}`}
              className="neu-btn flex items-center gap-3 rounded-3xl bg-gradient-to-r from-brand to-brand-dark p-4 text-white shadow-lg"
            >
              <span className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-white/15">
                <span aria-hidden className="anim-ping absolute inset-0 rounded-full bg-accent/50" />
                <PhoneIcon className="relative size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">
                  {activeCalls[0].startedByMe
                    ? "Your call is in progress"
                    : `${activeCalls[0].startedByName} is calling you`}
                </span>
                <span className="block text-sm text-white/70">Tap to join the video call</span>
              </span>
              <span className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-bold text-brand">
                Join
              </span>
            </Link>
          </div>
        )}

        {/* Le club en un coup d'œil */}
        <GlassCard className="anim-rise" style={delay(200)}>
          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat value={activeCalls.length} label="Calls now" />
            <Stat value={rooms === null ? "–" : rooms.length} label="Open rooms" />
            <Stat value={upcomingCount} label="Classes ahead" />
          </div>
        </GlassCard>

        {/* Le prochain cours */}
        {nextEvent?.startsAt && (
          <div className="anim-rise" style={delay(280)}>
            <Link href="/events" className="block">
              <GlassCard className="neu-btn flex items-center gap-4">
                <span className="flex size-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-dark text-white shadow-md ring-1 ring-white/20">
                  <span className="font-display text-xl font-bold leading-none">
                    {new Intl.DateTimeFormat("en-GB", { day: "2-digit" }).format(nextEvent.startsAt)}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-white/80">
                    {new Intl.DateTimeFormat("en-GB", { month: "short" }).format(nextEvent.startsAt)}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-accent">
                    Next class
                  </span>
                  <span className="block truncate font-semibold text-white">{nextEvent.title}</span>
                  <span className="block text-sm text-white/60">
                    {new Intl.DateTimeFormat("en-GB", {
                      weekday: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(nextEvent.startsAt)}
                  </span>
                </span>
                <span aria-hidden className="text-white/40">→</span>
              </GlassCard>
            </Link>
          </div>
        )}

        {/* Les grandes tuiles, comme des icônes d'application */}
        <div className="grid grid-cols-2 gap-4">
          <Tile href="/calls" title="Calls" hint="Talk to a member" delayMs={360}>
            <PhoneIcon className="size-7" />
          </Tile>
          <Tile href="/rooms" title="Rooms" hint="Group conversations" delayMs={440}>
            <PeopleIcon className="size-7" />
          </Tile>
          <Tile href="/events" title="Events" hint="Classes & news" delayMs={520}>
            <CalendarIcon className="size-7" />
          </Tile>
          <Tile href="/profile" title="Profile" hint="Your info & photo" delayMs={600}>
            <UserIcon className="size-7" />
          </Tile>
        </div>
      </div>
    </>
  );
}

/* ---------- Petits morceaux ---------- */

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="neu-inset rounded-2xl px-2 py-3">
      <p className="font-display text-2xl font-bold text-accent">{value}</p>
      <p className="text-xs text-white/60">{label}</p>
    </div>
  );
}

function Tile({
  href,
  title,
  hint,
  delayMs,
  children,
}: {
  href: string;
  title: string;
  hint: string;
  delayMs: number;
  children: ReactNode;
}) {
  return (
    <Link href={href} className="anim-rise block" style={delay(delayMs)}>
      <GlassCard className="neu-btn flex flex-col items-center gap-3 py-6 text-center">
        <span className="neu-inset flex size-14 items-center justify-center rounded-2xl text-accent">
          {children}
        </span>
        <span>
          <span className="block font-display text-lg font-bold text-white">{title}</span>
          <span className="block text-xs text-white/55">{hint}</span>
        </span>
      </GlassCard>
    </Link>
  );
}

/* Icônes fines */

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.4 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.6 1.9Z" />
    </svg>
  );
}

function PeopleIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.8 19a6.2 6.2 0 0 1 12.4 0" />
      <circle cx="17" cy="9.5" r="2.4" />
      <path d="M15.6 14.5a4.9 4.9 0 0 1 5.6 4.5" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}
