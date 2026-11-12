import type { Metadata } from "next";
import { ActivityIcon } from "@/components/activity-icon";
import Link from "next/link";
import { Suspense } from "react";
import { MemberAvatar } from "@/components/member-avatar";
import { RoomTimeLeft } from "@/components/room-timer";
import { requireAdmin } from "@/lib/admin";
import { loadDashboard, SIGNUP_DAYS, type DashboardData } from "@/lib/admin-stats";
import {
  ArrowIcon,
  CalendarIcon,
  KindIcon,
  kindTone,
  PhoneIcon,
  PulseIcon,
  RoomIcon,
  UserPlusIcon,
  UsersIcon,
} from "./admin-icons";
import { AdminHeader, Chip, delay, EmptyState, Panel, StatTile, timeAgo } from "./admin-ui";

export const metadata: Metadata = { title: "Admin" };

// Page /admin : le tableau de bord du coach (protégé par la session admin).
export default function AdminPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <AdminHome />
    </Suspense>
  );
}

async function AdminHome() {
  await requireAdmin();
  const data = await loadDashboard();
  const { totals } = data;

  return (
    <>
      <AdminHeader
        eyebrow="Overview"
        title={
          <>
            Hello, <span className="text-highlight">Coach</span>
          </>
        }
        subtitle={
          <>
            {data.today} ·{" "}
            <span className="text-emerald-300">
              {totals.online} {totals.online === 1 ? "member" : "members"} online now
            </span>
          </>
        }
        right={
          <Link
            href="/admin/events"
            className="neu-btn flex items-center gap-2 rounded-full bg-gradient-to-r from-accent to-brand px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand/30"
          >
            <span aria-hidden className="text-base leading-none">+</span>
            New event
          </Link>
        }
      />

      {/* ----- Les chiffres clés ----- */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <StatTile
          style={delay(80)}
          label="Members"
          value={totals.members}
          icon={<UsersIcon />}
          tone="from-[#6d72ff] to-navy"
          hint={
            totals.newThisWeek > 0 ? (
              <span className="font-semibold text-emerald-300">+{totals.newThisWeek} this week</span>
            ) : (
              "No new member this week"
            )
          }
        />
        <StatTile
          style={delay(130)}
          label="Online now"
          value={totals.online}
          icon={<PulseIcon />}
          tone="from-emerald-400 to-teal-600"
          live
          hint={`${totals.completed} profiles completed`}
        />
        <StatTile
          style={delay(180)}
          label="Live rooms"
          value={totals.openRooms}
          icon={<RoomIcon />}
          tone="from-accent to-[#ff7a9a]"
          live={totals.openRooms > 0}
          hint={`${totals.upcomingEvents} upcoming ${totals.upcomingEvents === 1 ? "event" : "events"}`}
        />
        <StatTile
          style={delay(230)}
          label="Video calls"
          value={totals.calls}
          icon={<PhoneIcon />}
          tone="from-brand to-[#c2185b]"
          hint={`${totals.callsThisWeek} this week`}
        />
      </div>

      {/* ----- Inscriptions + niveaux ----- */}
      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <SignupsChart data={data} />
        <LevelsPanel data={data} />
      </div>

      {/* ----- En direct : salles, événements, activité ----- */}
      <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <LiveRooms data={data} />
        <UpcomingEvents data={data} />
        <RecentActivity data={data} />
      </div>

      {/* ----- Les derniers inscrits ----- */}
      <Panel
        className="mt-5"
        style={delay(520)}
        title="Newest members"
        icon={<UserPlusIcon className="size-[18px]" />}
        action={<SeeAll href="/admin/members" />}
      >
        {data.newest.length === 0 ? (
          <EmptyState icon={<UsersIcon />} title="No members yet" />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
            {data.newest.map((member) => (
              <li key={member.id}>
                <Link
                  href={`/admin/members/${member.id}`}
                  className="neu-sm neu-btn flex items-center gap-3 rounded-2xl p-3 xl:flex-col xl:p-4 xl:text-center"
                >
                  <MemberAvatar
                    userId={member.id}
                    name={member.name}
                    hasPhoto={member.hasPhoto}
                    size="size-11 xl:size-14"
                  />
                  <span className="min-w-0 flex-1 xl:w-full">
                    <span className="block truncate text-sm font-semibold text-white">{member.name}</span>
                    <span className="block truncate text-[11px] text-white/45">
                      Joined {timeAgo(member.createdAt)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}

/* ---------- Les blocs du tableau de bord ---------- */

function SeeAll({ href, label = "See all" }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
    >
      {label}
      <ArrowIcon className="size-3.5" />
    </Link>
  );
}

/** Les inscriptions des 14 derniers jours (barres). */
function SignupsChart({ data }: { data: DashboardData }) {
  const max = Math.max(1, ...data.signups.map((day) => day.count));
  const total = data.signups.reduce((sum, day) => sum + day.count, 0);

  return (
    <Panel
      className="xl:col-span-2"
      style={delay(280)}
      title="New members"
      icon={<UserPlusIcon className="size-[18px]" />}
      action={<Chip tone="accent">Last {SIGNUP_DAYS} days</Chip>}
    >
      <p className="-mt-1 mb-6 text-sm text-white/55">
        <span className="font-display text-3xl font-extrabold text-white">{total}</span>{" "}
        {total === 1 ? "person joined" : "people joined"} the club
      </p>

      <div
        role="img"
        aria-label={`New members per day for the last ${SIGNUP_DAYS} days: ${data.signups
          .map((day) => `${day.label} ${day.count}`)
          .join(", ")}`}
        className="relative"
      >
        {/* Lignes de repère */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-40">
          {[0, 1, 2, 3].map((line) => (
            <span
              key={line}
              className="absolute inset-x-0 border-t border-dashed border-white/[0.07]"
              style={{ top: `${(line / 3) * 100}%` }}
            />
          ))}
        </div>

        <ul aria-hidden className="relative flex h-40 items-end gap-1.5 sm:gap-2">
          {data.signups.map((day, index) => {
            const isToday = index === data.signups.length - 1;
            const height = day.count === 0 ? 3 : Math.max(8, (day.count / max) * 100);
            return (
              <li key={day.day} className="group relative flex h-full flex-1 flex-col justify-end">
                {/* La bulle au survol */}
                <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-white px-2 py-1 text-[11px] font-bold text-navy opacity-0 shadow-lg transition group-hover:opacity-100">
                  {day.count} · {day.label}
                </span>
                <span
                  className={`block w-full rounded-t-lg transition-all duration-500 group-hover:brightness-125 ${
                    day.count === 0
                      ? "bg-white/10"
                      : isToday
                        ? "bg-gradient-to-t from-brand to-accent shadow-[0_0_20px_rgba(247,148,74,0.45)]"
                        : "bg-gradient-to-t from-brand/70 to-accent/80"
                  }`}
                  style={{ height: `${height}%` }}
                />
              </li>
            );
          })}
        </ul>
        <ul aria-hidden className="mt-2 flex gap-1.5 sm:gap-2">
          {data.signups.map((day, index) => (
            <li key={day.day} className="flex-1 text-center text-[10px] text-white/40">
              {index % 2 === 1 || index === data.signups.length - 1 ? day.label.split(" ")[0] : ""}
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}

/** Les niveaux d'anglais + la part des fiches terminées. */
function LevelsPanel({ data }: { data: DashboardData }) {
  const { members, completed } = data.totals;
  const percent = members === 0 ? 0 : Math.round((completed / members) * 100);
  const max = Math.max(1, ...data.levels.map((level) => level.count));
  const colors = ["bg-emerald-400", "bg-[#6d72ff]", "bg-accent", "bg-[#ff7a9a]"];

  return (
    <Panel style={delay(330)} title="English levels" icon={<PulseIcon className="size-[18px]" />}>
      <div className="flex items-center gap-4">
        {/* L'anneau : la part des fiches terminées */}
        <div
          className="relative flex size-24 shrink-0 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(var(--color-accent) ${percent * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
          }}
        >
          <span className="flex size-[4.6rem] flex-col items-center justify-center rounded-full bg-[#2a1238]">
            <span className="font-display text-xl font-extrabold text-white">{percent}%</span>
            <span className="text-[9px] font-semibold uppercase tracking-wider text-white/45">ready</span>
          </span>
        </div>
        <p className="text-sm leading-relaxed text-white/60">
          <span className="font-semibold text-white">{completed}</span> of {members} members finished
          their profile.
        </p>
      </div>

      <ul className="mt-5 space-y-3">
        {data.levels.map((level, index) => (
          <li key={level.value}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-semibold text-white/80">{level.label}</span>
              <span className="tabular-nums text-white/50">{level.count}</span>
            </div>
            <div className="neu-inset h-2 overflow-hidden rounded-full">
              <span
                className={`block h-full rounded-full ${colors[index % colors.length]}`}
                style={{ width: `${level.count === 0 ? 0 : Math.max(6, (level.count / max) * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/** Les salles ouvertes en ce moment. */
function LiveRooms({ data }: { data: DashboardData }) {
  return (
    <Panel
      style={delay(380)}
      title="Live rooms"
      icon={<RoomIcon className="size-[18px]" />}
      action={<SeeAll href="/admin/rooms" label="Manage" />}
    >
      {data.rooms.length === 0 ? (
        <EmptyState icon={<RoomIcon />} title="No room open" text="Rooms opened by members show up here." />
      ) : (
        <ul className="space-y-2.5">
          {data.rooms.map((room) => (
            <li key={room.id} className="neu-inset flex items-center gap-3 rounded-2xl p-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent/30 to-brand/30 text-accent ring-1 ring-white/10">
                <ActivityIcon icon={room.icon} className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-semibold text-white">{room.topic ?? room.name}</span>
                  {room.isPrivate && <Chip>Private</Chip>}
                </span>
                <span className="block truncate text-[11px] text-white/45">
                  {room.activity ? `${room.activity} · ` : ""}by {room.host}
                </span>
              </span>
              {room.endsAt && (
                <RoomTimeLeft endsAt={room.endsAt} className="shrink-0 text-[11px] font-bold" />
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/** Les prochains événements, avec les réponses des membres. */
function UpcomingEvents({ data }: { data: DashboardData }) {
  const month = new Intl.DateTimeFormat("en-GB", { month: "short" });
  const time = new Intl.DateTimeFormat("en-GB", { weekday: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <Panel
      style={delay(430)}
      title="Upcoming events"
      icon={<CalendarIcon className="size-[18px]" />}
      action={<SeeAll href="/admin/events" label="Manage" />}
    >
      {data.events.length === 0 ? (
        <EmptyState icon={<CalendarIcon />} title="No event planned" text="Publish a class to see it here." />
      ) : (
        <ul className="space-y-2.5">
          {data.events.map((event) => (
            <li key={event.id} className="neu-inset flex items-center gap-3 rounded-2xl p-3">
              <span className="flex size-11 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-accent to-brand text-white">
                <span className="font-display text-base font-extrabold leading-none">
                  {event.startsAt.getDate()}
                </span>
                <span className="text-[9px] font-bold uppercase">{month.format(event.startsAt)}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-white">{event.title}</span>
                <span className="block text-[11px] text-white/45">{time.format(event.startsAt)}</span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1 text-[11px]">
                <span className="font-semibold text-emerald-300">{event.going} going</span>
                <span className="text-white/45">{event.interested} interested</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/** Ce qui vient de se passer (les dernières notifications). */
function RecentActivity({ data }: { data: DashboardData }) {
  return (
    <Panel
      className="md:col-span-2 xl:col-span-1"
      style={delay(480)}
      title="Recent activity"
      icon={<PulseIcon className="size-[18px]" />}
      action={<SeeAll href="/admin/notifications" />}
    >
      {data.activity.length === 0 ? (
        <EmptyState icon={<PulseIcon />} title="All quiet" text="New members and rooms will appear here." />
      ) : (
        <ol className="relative space-y-4 before:absolute before:bottom-2 before:left-[17px] before:top-2 before:w-px before:bg-white/10">
          {data.activity.map((item) => (
            <li key={item.id} className="relative flex items-start gap-3">
              <span
                className={`relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${kindTone(item.kind)} text-white ring-4 ring-[#2a1238]`}
              >
                <KindIcon kind={item.kind} className="size-4" />
              </span>
              <span className="min-w-0 flex-1 pt-0.5">
                <span
                  className={`block truncate text-sm font-semibold ${item.read ? "text-white/70" : "text-white"}`}
                >
                  {item.title}
                </span>
                <span className="block truncate text-[11px] text-white/45">
                  {item.body ? `${item.body} · ` : ""}
                  {timeAgo(item.createdAt)}
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

/** Le squelette pendant le chargement (même forme que la page). */
function DashboardSkeleton() {
  return (
    <div aria-busy className="animate-pulse">
      <div className="mb-8 space-y-3">
        <div className="h-3 w-24 rounded-full bg-white/10" />
        <div className="h-10 w-64 rounded-2xl bg-white/10" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="neu h-40 rounded-3xl" />
        ))}
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <div className="neu h-72 rounded-3xl xl:col-span-2" />
        <div className="neu h-72 rounded-3xl" />
      </div>
    </div>
  );
}
