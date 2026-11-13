import type { Metadata } from "next";
import { countUnread, markTabRead } from "@/lib/notifications";
import { GuideButton } from "@/components/guide-dialog";
import { getGuideSteps, shouldShowGuide } from "@/lib/guide";
import { markGuideSeenAction } from "../guide-actions";
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
    prisma.profile.count({ where: { completedAt: { not: null } } }),
  ]);
}

async function HomeDashboard() {
  const user = await requireMember();
  // Ce menu est ouvert : sa pastille disparaît
  await markTabRead(user.id, "home");
  const [[profile, activeCalls, rooms, nextEvent, upcomingCount, membersCount], unread, guideSteps, firstVisit] =
    await Promise.all([loadHome(user.id), countUnread(user.id), getGuideSteps(), shouldShowGuide(user.id)]);

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
        // La photo de profil en haut à droite ; les membres sont dans les tuiles plus bas.
        members={false}
        rightTop
        right={
          <div className="flex items-center gap-2.5">
            {/* Le guide "How it works" (s'ouvre tout seul une fois pour un nouveau membre) */}
            <GuideButton steps={guideSteps} autoOpen={firstVisit} onSeen={markGuideSeenAction} />
            <Link href="/profile" aria-label="My profile" className="neu-btn rounded-full">
              <MemberAvatar
                userId={user.id}
                name={user.firstName}
                hasPhoto={Boolean(profile?.photoType)}
                size="size-12"
              />
            </Link>
          </div>
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

        {/* Les tuiles de couleur, en mosaïque (deux hautes, quatre normales) avec le chiffre du moment */}
        <div className="grid auto-rows-[8.25rem] grid-cols-2 gap-3.5 [grid-auto-flow:dense]">
          <Tile
            href="/calls"
            title="Calls"
            value={activeCalls.length}
            unit="now"
            hint="Talk to a member"
            tone="from-accent/60 to-brand/55"
            tall
            delayMs={200}
            icon={<PhoneIcon className="size-4" />}
          />
          <Tile
            href="/rooms"
            title="Rooms"
            value={rooms === null ? "–" : rooms.length}
            unit="open"
            hint="Group talks"
            tone="from-indigo-400/40 to-navy/70"
            delayMs={280}
            icon={<PeopleIcon className="size-4" />}
          />
          <Tile
            href="/events"
            title="Events"
            value={upcomingCount}
            unit="ahead"
            hint="Classes & news"
            tone="from-brand/60 to-brand-dark/50"
            delayMs={360}
            icon={<CalendarIcon className="size-4" />}
          />
          <Tile
            href="/members"
            title="Members"
            value={membersCount}
            unit="in the club"
            hint="Everyone"
            tone="from-cream/35 via-accent/35 to-accent/15"
            delayMs={440}
            icon={<MembersIcon className="size-4" />}
          />
          <Tile
            href="/notifications"
            title="Notifications"
            value={unread}
            unit="new"
            hint="What's new for you"
            tone="from-rose-400/45 to-brand/55"
            tall
            delayMs={520}
            icon={<BellIcon className="size-4" />}
          />
          <Tile
            href="/profile"
            title="Profile"
            value="Me"
            hint="Your info & photo"
            tone="from-violet-400/35 to-navy/70"
            delayMs={600}
            icon={<UserIcon className="size-4" />}
          />
        </div>
      </div>
    </>
  );
}

/* ---------- Petits morceaux ---------- */

/**
 * Une tuile de couleur : le nom en haut, un grand chiffre, une petite étoile,
 * et un motif léger dans le coin. "tall" = deux fois plus haute.
 */
function Tile({
  href,
  title,
  value,
  unit,
  hint,
  tone,
  tall = false,
  delayMs,
  icon,
}: {
  href: string;
  title: string;
  value: number | string;
  unit?: string;
  hint: string;
  /** Les couleurs du dégradé (classes Tailwind from-/via-/to-). */
  tone: string;
  tall?: boolean;
  delayMs: number;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      style={delay(delayMs)}
      className={`anim-rise group relative isolate flex flex-col overflow-hidden rounded-[1.75rem] bg-gradient-to-br ${tone} p-4 text-white backdrop-blur-md shadow-[0_18px_35px_-18px_rgba(0,0,0,0.75)] ring-1 ring-white/15 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_26px_45px_-18px_rgba(0,0,0,0.85)] active:scale-[0.98] ${
        tall ? "row-span-2" : ""
      }`}
    >
      {/* Lumière douce et motif décoratif */}
      <span aria-hidden className="absolute -right-10 -top-10 -z-10 size-32 rounded-full bg-white/10 blur-2xl" />
      <TilePattern />

      <span className="flex items-start justify-between gap-2">
        <span className="font-display text-[15px] font-bold leading-tight drop-shadow-sm">{title}</span>
        <SparkleIcon className="size-4 shrink-0 text-white/85 transition-transform duration-500 group-hover:rotate-90" />
      </span>

      <span className={`flex items-baseline gap-1.5 ${tall ? "mt-auto" : "mt-auto"}`}>
        <span
          className={`font-display font-extrabold leading-none tracking-tight drop-shadow ${
            tall ? "text-6xl" : "text-[2.6rem]"
          }`}
        >
          {value}
        </span>
        {unit && <span className="text-xs font-semibold text-white/80">{unit}</span>}
      </span>

      <span className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-white/85">
        <span className="flex size-6 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">{icon}</span>
        <span className="truncate">{hint}</span>
      </span>
    </Link>
  );
}

/** Le motif léger dans le coin (lignes et points, comme un circuit). */
function TilePattern() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 80 80"
      className="absolute -bottom-3 -right-3 -z-10 size-20 text-white/15"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    >
      <path d="M10 70h20l10-10h20M20 78V60l8-8h24M40 80V66l6-6h30M60 50v-8l8-8h12" />
      <circle cx="60" cy="60" r="2.2" fill="currentColor" />
      <circle cx="52" cy="52" r="2.2" fill="currentColor" />
      <circle cx="60" cy="42" r="2.2" fill="currentColor" />
      <circle cx="30" cy="70" r="2.2" fill="currentColor" />
    </svg>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2c.4 3.6 1.6 6 3.3 7.7C17 11.4 19.4 12.6 23 13c-3.6.4-6 1.6-7.7 3.3C13.6 18 12.4 20.4 12 24c-.4-3.6-1.6-6-3.3-7.7C7 14.6 4.6 13.4 1 13c3.6-.4 6-1.6 7.7-3.3C10.4 8 11.6 5.6 12 2Z" />
    </svg>
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

function MembersIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <circle cx="12" cy="7.5" r="3" />
      <path d="M6.5 19a5.5 5.5 0 0 1 11 0" />
      <circle cx="5" cy="10" r="2.1" />
      <path d="M1.8 17.5a3.6 3.6 0 0 1 4-3" />
      <circle cx="19" cy="10" r="2.1" />
      <path d="M22.2 17.5a3.6 3.6 0 0 0-4-3" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M6 9.5a6 6 0 0 1 12 0c0 4.5 1.8 6.5 1.8 6.5H4.2S6 14 6 9.5Z" />
      <path d="M10 19.5a2 2 0 0 0 4 0" />
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
